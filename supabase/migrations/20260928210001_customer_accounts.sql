-- =====================================================================
-- Customer accounts (real login, multi-booking history, profile, notifications)
--
-- Ownership model
--   booking / rental_bookings / customer_subscriptions get customer_user_id (auth.users).
--   Linked three ways:
--     1. automatically at insert, when a signed-in customer makes the booking
--     2. by verified email on login (customer_sync_account) - bookings only
--     3. manually with the ticket / subscription code (customer_claim_by_code)
--   Staff / partner / operator sessions never become the owner of a booking they create
--   on someone else's behalf.
--
-- Security: every new table is locked (RLS on, no policies, no grants); the frontend only
-- uses SECURITY DEFINER RPCs that filter on auth.uid().
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.customer_profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  full_name        text check (full_name is null or char_length(full_name) <= 120),
  phone_number     text check (phone_number is null or char_length(phone_number) <= 30),
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en')),
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.customer_saved_passengers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  full_name    text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone_number text check (phone_number is null or char_length(phone_number) <= 30),
  relation     text check (relation is null or char_length(relation) <= 40),
  created_at   timestamptz not null default now()
);
create index if not exists customer_saved_passengers_user_idx on public.customer_saved_passengers (user_id);

create table if not exists public.customer_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null,
  data       jsonb not null default '{}'::jsonb,
  link_path  text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists customer_notifications_user_idx on public.customer_notifications (user_id, created_at desc);
create unique index if not exists customer_notifications_dedupe_idx
  on public.customer_notifications (user_id, dedupe_key) where dedupe_key is not null;

create table if not exists public.customer_claim_attempts (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists customer_claim_attempts_idx on public.customer_claim_attempts (user_id, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['customer_profiles', 'customer_saved_passengers', 'customer_notifications', 'customer_claim_attempts']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on sequence public.customer_claim_attempts_id_seq to service_role;

-- ---------------------------------------------------------------------
-- Ownership columns
-- ---------------------------------------------------------------------
alter table public.booking               add column if not exists customer_user_id uuid references auth.users (id) on delete set null;
alter table public.rental_bookings        add column if not exists customer_user_id uuid references auth.users (id) on delete set null;
alter table public.customer_subscriptions add column if not exists customer_user_id uuid references auth.users (id) on delete set null;

create index if not exists booking_customer_user_idx on public.booking (customer_user_id) where customer_user_id is not null;
create index if not exists rental_bookings_customer_user_idx on public.rental_bookings (customer_user_id) where customer_user_id is not null;
create index if not exists customer_subscriptions_customer_user_idx on public.customer_subscriptions (customer_user_id) where customer_user_id is not null;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public._is_internal_user(p_uid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select p_uid is not null and (
    exists (select 1 from staff_access where auth_user_id = p_uid)
    or exists (select 1 from portal_members where auth_user_id = p_uid)
  );
$$;

create or replace function public._require_customer() returns uuid
language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'لازم تسجل دخول الأول';
  end if;
  return v_uid;
end;
$$;

-- Auto-link at insert when a signed-in customer books for themselves.
create or replace function public._link_customer_on_insert() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid();
begin
  if new.customer_user_id is not null or v_uid is null then
    return new;
  end if;
  if _is_internal_user(v_uid) then
    return new;
  end if;
  if tg_table_name = 'booking' then
    -- new.booking_channel only exists on booking, so keep this check nested
    if coalesce(new.booking_channel, 'website') <> 'website' then
      return new;
    end if;
  end if;
  new.customer_user_id := v_uid;
  return new;
end;
$$;

drop trigger if exists trg_link_customer_booking on public.booking;
create trigger trg_link_customer_booking before insert on public.booking
  for each row execute function public._link_customer_on_insert();
drop trigger if exists trg_link_customer_rental on public.rental_bookings;
create trigger trg_link_customer_rental before insert on public.rental_bookings
  for each row execute function public._link_customer_on_insert();
drop trigger if exists trg_link_customer_subscription on public.customer_subscriptions;
create trigger trg_link_customer_subscription before insert on public.customer_subscriptions
  for each row execute function public._link_customer_on_insert();

-- ---------------------------------------------------------------------
-- Account sync + claim
-- ---------------------------------------------------------------------
create or replace function public.customer_sync_account() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_email text;
  v_linked integer := 0;
begin
  select email into v_email from auth.users where id = v_uid and email_confirmed_at is not null;

  insert into customer_profiles (user_id) values (v_uid) on conflict (user_id) do nothing;

  if v_email is not null and not _is_internal_user(v_uid) then
    update booking
       set customer_user_id = v_uid
     where customer_user_id is null
       and customer_email is not null
       and lower(btrim(customer_email)) = lower(v_email);
    get diagnostics v_linked = row_count;
  end if;

  -- seed empty profile fields from the latest booking
  update customer_profiles p
     set full_name    = coalesce(p.full_name, b.full_name),
         phone_number = coalesce(p.phone_number, b.phone_number),
         updated_at   = now()
    from (select full_name, phone_number from booking
           where customer_user_id = v_uid order by created_at desc limit 1) b
   where p.user_id = v_uid and (p.full_name is null or p.phone_number is null);

  return jsonb_build_object('linked_bookings', v_linked);
end;
$$;

create or replace function public.customer_claim_by_code(p_code text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_id uuid;
  v_owner uuid;
begin
  if char_length(v_code) < 4 then
    raise exception 'الكود غير صحيح';
  end if;

  if (select count(*) from customer_claim_attempts
       where user_id = v_uid and created_at > now() - interval '15 minutes') >= 10 then
    raise exception 'محاولات كتير. جرّب بعد شوية.';
  end if;

  select id, customer_user_id into v_id, v_owner from booking where upper(ticket_code) = v_code;
  if found then
    if v_owner is not null and v_owner <> v_uid then raise exception 'الكود ده مرتبط بحساب تاني'; end if;
    update booking set customer_user_id = v_uid where id = v_id and customer_user_id is null;
    return jsonb_build_object('kind', 'booking', 'id', v_id);
  end if;

  select id, customer_user_id into v_id, v_owner from rental_bookings where upper(ticket_code) = v_code;
  if found then
    if v_owner is not null and v_owner <> v_uid then raise exception 'الكود ده مرتبط بحساب تاني'; end if;
    update rental_bookings set customer_user_id = v_uid where id = v_id and customer_user_id is null;
    return jsonb_build_object('kind', 'rental', 'id', v_id);
  end if;

  select id, customer_user_id into v_id, v_owner from customer_subscriptions where upper(subscription_code) = v_code;
  if found then
    if v_owner is not null and v_owner <> v_uid then raise exception 'الكود ده مرتبط بحساب تاني'; end if;
    update customer_subscriptions set customer_user_id = v_uid where id = v_id and customer_user_id is null;
    return jsonb_build_object('kind', 'subscription', 'id', v_id);
  end if;

  insert into customer_claim_attempts (user_id) values (v_uid);
  raise exception 'الكود غير صحيح';
end;
$$;

-- ---------------------------------------------------------------------
-- Profile + saved passengers
-- ---------------------------------------------------------------------
create or replace function public.customer_get_profile() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_email text;
  v_row customer_profiles;
begin
  select email into v_email from auth.users where id = v_uid;
  select * into v_row from customer_profiles where user_id = v_uid;
  return jsonb_build_object(
    'email', v_email,
    'full_name', v_row.full_name,
    'phone_number', v_row.phone_number,
    'preferred_language', coalesce(v_row.preferred_language, 'ar'),
    'marketing_opt_in', coalesce(v_row.marketing_opt_in, false),
    'created_at', v_row.created_at
  );
end;
$$;

create or replace function public.customer_update_profile(
  p_full_name text, p_phone_number text, p_preferred_language text, p_marketing_opt_in boolean
) returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  if p_preferred_language is not null and p_preferred_language not in ('ar', 'en') then
    raise exception 'لغة غير مدعومة';
  end if;
  insert into customer_profiles (user_id, full_name, phone_number, preferred_language, marketing_opt_in)
  values (v_uid, nullif(btrim(p_full_name), ''), nullif(btrim(p_phone_number), ''),
          coalesce(p_preferred_language, 'ar'), coalesce(p_marketing_opt_in, false))
  on conflict (user_id) do update
     set full_name = nullif(btrim(p_full_name), ''),
         phone_number = nullif(btrim(p_phone_number), ''),
         preferred_language = coalesce(p_preferred_language, customer_profiles.preferred_language),
         marketing_opt_in = coalesce(p_marketing_opt_in, customer_profiles.marketing_opt_in),
         updated_at = now();
end;
$$;

create or replace function public.customer_list_passengers()
returns table (id uuid, full_name text, phone_number text, relation text)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  return query
  select p.id, p.full_name, p.phone_number, p.relation
    from customer_saved_passengers p where p.user_id = v_uid order by p.created_at;
end;
$$;

create or replace function public.customer_save_passenger(
  p_id uuid, p_full_name text, p_phone_number text, p_relation text
) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_id uuid;
begin
  if p_id is null then
    if (select count(*) from customer_saved_passengers where user_id = v_uid) >= 10 then
      raise exception 'وصلت للحد الأقصى (10 ركاب محفوظين)';
    end if;
    insert into customer_saved_passengers (user_id, full_name, phone_number, relation)
    values (v_uid, btrim(p_full_name), nullif(btrim(p_phone_number), ''), nullif(btrim(p_relation), ''))
    returning customer_saved_passengers.id into v_id;
  else
    update customer_saved_passengers
       set full_name = btrim(p_full_name), phone_number = nullif(btrim(p_phone_number), ''),
           relation = nullif(btrim(p_relation), '')
     where customer_saved_passengers.id = p_id and user_id = v_uid
    returning customer_saved_passengers.id into v_id;
    if v_id is null then raise exception 'الراكب غير موجود'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.customer_delete_passenger(p_id uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  delete from customer_saved_passengers where customer_saved_passengers.id = p_id and user_id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------
-- Trips
-- ---------------------------------------------------------------------
create or replace function public.customer_list_bookings(
  p_scope text default 'all', p_limit integer default 20, p_offset integer default 0
) returns table (
  id uuid, ticket_code text, status text, booking_type text,
  travel_date date, travel_datetime timestamptz, seats_count integer, luggage_count integer,
  meeting_point text, flight_number text,
  origin text, origin_en text, destination text, destination_en text,
  airport_name text, airport_name_en text, country text, direction text,
  expected_total_usd numeric, currency text, total_amount numeric, invoice_number bigint,
  full_name text, phone_number text, passenger_names text[],
  driver_name text, driver_phone text, vehicle_plate text, vehicle_model text,
  payment_status text, payment_method text,
  cancellation_reason text, cancelled_at timestamptz, refund_status text,
  rating_stars integer, package_name text, package_name_en text,
  created_at timestamptz, is_upcoming boolean
)
language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_scope text := coalesce(p_scope, 'all');
begin
  if v_scope not in ('all', 'upcoming', 'past') then
    raise exception 'نطاق غير صحيح';
  end if;

  return query
  select x.* from (
    select b.id, b.ticket_code, b.status, b.booking_type,
           b.travel_date, b.travel_datetime, b.seats_count, b.luggage_count,
           b.meeting_point, b.flight_number,
           t.origin, t.origin_en, t.destination, t.destination_en,
           t.airport_name, t.airport_name_en, t.country, coalesce(b.direction, t.direction) as direction,
           b.expected_total_usd, b.currency, b.total_amount, b.invoice_number,
           b.full_name, b.phone_number,
           coalesce((select array_agg(bp.full_name order by bp.created_at) from booking_passengers bp where bp.booking_id = b.id), array[]::text[]) as passenger_names,
           d.full_name as driver_name, d.phone_number as driver_phone, v.plate_number as vehicle_plate, v.make_model as vehicle_model,
           pay.review_status as payment_status, pay.method as payment_method,
           b.cancellation_reason, b.cancelled_at, b.refund_status,
           r.stars as rating_stars, pk.name as package_name, pk.name_en as package_name_en,
           b.created_at,
           (b.status <> 'cancelled' and coalesce(b.travel_datetime, b.travel_date::timestamptz + interval '23 hours') >= now()) as is_upcoming
      from booking b
      left join trip t on t.id = b.trip_id
      left join trip_assignments ta on ta.id = b.trip_assignment_id
      left join drivers d on d.id = ta.driver_id
      left join vehicles v on v.id = ta.vehicle_id
      left join packages pk on pk.id = b.package_id
      left join ratings r on r.booking_id = b.id
      left join lateral (
        select p.review_status, p.method from payments p
         where p.booking_id = b.id order by p.created_at desc limit 1
      ) pay on true
     where b.customer_user_id = v_uid
  ) x
  where v_scope = 'all'
     or (v_scope = 'upcoming' and x.is_upcoming)
     or (v_scope = 'past' and not x.is_upcoming)
  order by case when v_scope = 'upcoming' then coalesce(x.travel_datetime, x.travel_date::timestamptz) end asc,
           coalesce(x.travel_datetime, x.travel_date::timestamptz) desc
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(0, coalesce(p_offset, 0));
end;
$$;

create or replace function public.customer_list_rentals()
returns table (
  id uuid, ticket_code text, status text, start_datetime timestamptz, end_datetime timestamptz,
  duration_type text, pickup_location text, total_usd numeric, addons_total_usd numeric, currency text,
  vehicle_make_model text, vehicle_plate text, vehicle_photo text,
  driver_name text, driver_phone text, addon_names text[],
  cancellation_reason text, cancelled_at timestamptz, created_at timestamptz
)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  return query
  select rb.id, rb.ticket_code, rb.status, rb.start_datetime, rb.end_datetime,
         rb.duration_type, rb.pickup_location, rb.total_usd, rb.addons_total_usd, rb.currency,
         rv.make_model, rv.plate_number, rv.photos[1],
         rv.driver_full_name, rv.driver_phone_number,
         (select array_agg(ras.name_ar order by ras.sort_order)
            from rental_booking_addon_services rbas
            join rental_addon_services ras on ras.id = rbas.addon_service_id
           where rbas.booking_id = rb.id),
         rb.cancellation_reason, rb.cancelled_at, rb.created_at
    from rental_bookings rb
    join rental_vehicles rv on rv.id = rb.rental_vehicle_id
   where rb.customer_user_id = v_uid
   order by rb.start_datetime desc;
end;
$$;

create or replace function public.customer_list_subscriptions()
returns table (
  id uuid, subscription_code text, status text, starts_at date, ends_at date,
  expected_total_usd numeric, ride_credits_remaining integer, rides_discounted_count integer,
  plan_name text, plan_name_en text, tier text, duration text, discount_percent numeric,
  free_ride_credits integer, priority_support boolean, guaranteed_seat boolean,
  cancelled_at timestamptz, created_at timestamptz
)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  return query
  select s.id, s.subscription_code, s.status, s.starts_at, s.ends_at,
         s.expected_total_usd, s.ride_credits_remaining, s.rides_discounted_count,
         p.name, p.name_en, p.tier, p.duration, p.discount_percent,
         p.free_ride_credits, p.priority_support, p.guaranteed_seat,
         s.cancelled_at, s.created_at
    from customer_subscriptions s
    left join subscription_plans p on p.id = s.plan_id
   where s.customer_user_id = v_uid
   order by s.created_at desc;
end;
$$;

create or replace function public.customer_list_payments(p_limit integer default 50)
returns table (
  kind text, reference_code text, method text, amount_usd numeric,
  review_status text, reference_number text, created_at timestamptz
)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  return query
  select x.* from (
    select 'booking'::text as kind, b.ticket_code as reference_code, p.method, p.amount_usd, p.review_status, p.reference_number, p.created_at
      from payments p join booking b on b.id = p.booking_id
     where b.customer_user_id = v_uid
    union all
    select 'subscription'::text, s.subscription_code, sp.method, sp.amount_usd, sp.review_status, sp.reference_number, sp.created_at
      from subscription_payments sp join customer_subscriptions s on s.id = sp.subscription_id
     where s.customer_user_id = v_uid
  ) x
  order by x.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

-- ---------------------------------------------------------------------
-- Overview
-- ---------------------------------------------------------------------
create or replace function public.customer_get_overview() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_next jsonb;
  v_sub jsonb;
  v_upcoming integer;
  v_completed integer;
  v_cancelled integer;
  v_awaiting integer;
  v_spent numeric;
  v_unread integer;
begin
  select count(*) filter (where b.status <> 'cancelled' and coalesce(b.travel_datetime, b.travel_date::timestamptz + interval '23 hours') >= now()),
         count(*) filter (where b.status = 'confirmed' and coalesce(b.travel_datetime, b.travel_date::timestamptz + interval '23 hours') < now()),
         count(*) filter (where b.status = 'cancelled'),
         count(*) filter (where b.status = 'pending'
                           and not exists (select 1 from payments p where p.booking_id = b.id and p.review_status <> 'rejected'))
    into v_upcoming, v_completed, v_cancelled, v_awaiting
    from booking b where b.customer_user_id = v_uid;

  select coalesce(sum(p.amount_usd), 0) into v_spent
    from payments p join booking b on b.id = p.booking_id
   where b.customer_user_id = v_uid and p.review_status = 'confirmed' and b.refund_status <> 'refunded';

  select jsonb_build_object(
           'id', b.id, 'ticket_code', b.ticket_code, 'status', b.status, 'travel_datetime', b.travel_datetime,
           'travel_date', b.travel_date, 'seats_count', b.seats_count,
           'origin', t.origin, 'origin_en', t.origin_en, 'destination', t.destination, 'destination_en', t.destination_en,
           'driver_name', d.full_name, 'vehicle_plate', v.plate_number)
    into v_next
    from booking b
    left join trip t on t.id = b.trip_id
    left join trip_assignments ta on ta.id = b.trip_assignment_id
    left join drivers d on d.id = ta.driver_id
    left join vehicles v on v.id = ta.vehicle_id
   where b.customer_user_id = v_uid and b.status <> 'cancelled'
     and coalesce(b.travel_datetime, b.travel_date::timestamptz + interval '23 hours') >= now()
   order by coalesce(b.travel_datetime, b.travel_date::timestamptz) asc
   limit 1;

  select jsonb_build_object(
           'id', s.id, 'code', s.subscription_code, 'plan_name', p.name, 'plan_name_en', p.name_en,
           'ends_at', s.ends_at, 'credits', s.ride_credits_remaining, 'discount_percent', p.discount_percent)
    into v_sub
    from customer_subscriptions s left join subscription_plans p on p.id = s.plan_id
   where s.customer_user_id = v_uid and s.status = 'active'
   order by s.ends_at desc nulls last limit 1;

  select count(*) into v_unread from customer_notifications n where n.user_id = v_uid and n.read_at is null;

  return jsonb_build_object(
    'upcoming_count', coalesce(v_upcoming, 0), 'completed_count', coalesce(v_completed, 0),
    'cancelled_count', coalesce(v_cancelled, 0), 'awaiting_payment_count', coalesce(v_awaiting, 0),
    'total_spent_usd', v_spent, 'next_trip', v_next, 'active_subscription', v_sub,
    'unread_notifications', v_unread);
end;
$$;

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------
create or replace function public.customer_list_notifications(p_limit integer default 30, p_offset integer default 0)
returns table (id uuid, type text, data jsonb, link_path text, created_at timestamptz, is_read boolean)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  return query
  select n.id, n.type, n.data, n.link_path, n.created_at, (n.read_at is not null)
    from customer_notifications n where n.user_id = v_uid
   order by n.created_at desc
   limit greatest(1, least(coalesce(p_limit, 30), 100)) offset greatest(0, coalesce(p_offset, 0));
end;
$$;

create or replace function public.customer_mark_notifications_read(p_ids uuid[] default null) returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := _require_customer();
  v_count integer;
begin
  update customer_notifications n set read_at = now()
   where n.user_id = v_uid and n.read_at is null and (p_ids is null or n.id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public._cust_notify(p_user uuid, p_type text, p_data jsonb, p_link text, p_dedupe text)
returns void
language plpgsql security definer set search_path to 'public' as $$
begin
  if p_user is null then return; end if;
  insert into customer_notifications (user_id, type, data, link_path, dedupe_key)
  values (p_user, p_type, coalesce(p_data, '{}'::jsonb), p_link, p_dedupe)
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
exception when others then
  null; -- never block the business write
end;
$$;

-- booking status / driver / refund changes
create or replace function public._cust_notif_booking_update() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare v_data jsonb;
begin
  if new.customer_user_id is null then return new; end if;
  v_data := jsonb_build_object('booking_id', new.id, 'ticket_code', new.ticket_code, 'travel_datetime', new.travel_datetime);

  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    perform _cust_notify(new.customer_user_id, 'booking_confirmed', v_data, '/account/trips', 'bc:' || new.id::text);
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform _cust_notify(new.customer_user_id, 'booking_cancelled', v_data, '/account/trips', 'bx:' || new.id::text);
  end if;

  if old.trip_assignment_id is null and new.trip_assignment_id is not null and new.status <> 'cancelled' then
    perform _cust_notify(new.customer_user_id, 'driver_assigned', v_data, '/account/trips', 'da:' || new.id::text);
  end if;

  if new.refund_status in ('refunded', 'denied') and old.refund_status is distinct from new.refund_status then
    perform _cust_notify(new.customer_user_id, 'refund_' || new.refund_status, v_data, '/account/payments',
                         'rf:' || new.id::text || ':' || new.refund_status);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cust_notif_booking_update on public.booking;
create trigger trg_cust_notif_booking_update after update of status, trip_assignment_id, refund_status on public.booking
  for each row execute function public._cust_notif_booking_update();

-- payment reviewed
create or replace function public._cust_notif_payment_review() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  v_user uuid;
  v_ticket text;
begin
  if new.review_status in ('confirmed', 'rejected') and old.review_status is distinct from new.review_status then
    select customer_user_id, ticket_code into v_user, v_ticket from booking where id = new.booking_id;
    perform _cust_notify(v_user, 'payment_' || new.review_status,
                         jsonb_build_object('ticket_code', v_ticket, 'amount_usd', new.amount_usd),
                         '/account/payments', 'pay:' || new.id::text || ':' || new.review_status);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cust_notif_payment_review on public.payments;
create trigger trg_cust_notif_payment_review after update of review_status on public.payments
  for each row execute function public._cust_notif_payment_review();

create or replace function public._cust_notif_subscription_payment() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  v_user uuid;
  v_code text;
begin
  if new.review_status in ('confirmed', 'rejected') and old.review_status is distinct from new.review_status then
    select customer_user_id, subscription_code into v_user, v_code from customer_subscriptions where id = new.subscription_id;
    perform _cust_notify(v_user, 'subscription_payment_' || new.review_status,
                         jsonb_build_object('code', v_code, 'amount_usd', new.amount_usd),
                         '/account/subscriptions', 'spay:' || new.id::text || ':' || new.review_status);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cust_notif_subscription_payment on public.subscription_payments;
create trigger trg_cust_notif_subscription_payment after update of review_status on public.subscription_payments
  for each row execute function public._cust_notif_subscription_payment();

create or replace function public._cust_notif_subscription_status() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.customer_user_id is not null and new.status in ('active', 'expired') and old.status is distinct from new.status then
    perform _cust_notify(new.customer_user_id, 'subscription_' || new.status,
                         jsonb_build_object('code', new.subscription_code, 'ends_at', new.ends_at),
                         '/account/subscriptions', 'sub:' || new.id::text || ':' || new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cust_notif_subscription_status on public.customer_subscriptions;
create trigger trg_cust_notif_subscription_status after update of status on public.customer_subscriptions
  for each row execute function public._cust_notif_subscription_status();

-- shared departure reached / missed its minimum
create or replace function public._cust_notif_departure() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare r record;
begin
  if new.status in ('confirmed', 'below_minimum') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    for r in
      select b.id, b.customer_user_id, b.ticket_code, b.travel_datetime
        from booking b
       where b.schedule_id = new.schedule_id and b.travel_date = new.travel_date
         and b.customer_user_id is not null and b.status <> 'cancelled'
    loop
      perform _cust_notify(r.customer_user_id,
                           case when new.status = 'confirmed' then 'departure_confirmed' else 'departure_below_minimum' end,
                           jsonb_build_object('booking_id', r.id, 'ticket_code', r.ticket_code, 'travel_datetime', r.travel_datetime),
                           '/account/trips', 'dep:' || r.id::text || ':' || new.status);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cust_notif_departure on public.departure_status;
create trigger trg_cust_notif_departure after insert or update of status on public.departure_status
  for each row execute function public._cust_notif_departure();

-- 24h reminders + retention (cron, every 15 min)
create or replace function public.generate_customer_reminders() returns void
language plpgsql security definer set search_path to 'public' as $$
declare r record;
begin
  for r in
    select b.id, b.customer_user_id, b.ticket_code, b.travel_datetime
      from booking b
     where b.customer_user_id is not null and b.status = 'confirmed'
       and b.travel_datetime > now() and b.travel_datetime <= now() + interval '24 hours'
  loop
    perform _cust_notify(r.customer_user_id, 'trip_reminder',
                         jsonb_build_object('booking_id', r.id, 'ticket_code', r.ticket_code, 'travel_datetime', r.travel_datetime),
                         '/account/trips', 'rem:' || r.id::text);
  end loop;

  for r in
    select rb.id, rb.customer_user_id, rb.ticket_code, rb.start_datetime
      from rental_bookings rb
     where rb.customer_user_id is not null and rb.status = 'confirmed'
       and rb.start_datetime > now() and rb.start_datetime <= now() + interval '24 hours'
  loop
    perform _cust_notify(r.customer_user_id, 'rental_reminder',
                         jsonb_build_object('rental_id', r.id, 'ticket_code', r.ticket_code, 'start_datetime', r.start_datetime),
                         '/account/rentals', 'rrem:' || r.id::text);
  end loop;

  delete from customer_notifications where created_at < now() - interval '180 days';
  delete from customer_claim_attempts where created_at < now() - interval '1 day';
exception when others then
  null;
end;
$$;

do $$
begin
  perform cron.unschedule('goair-customer-reminders');
exception when others then
  null;
end $$;
select cron.schedule('goair-customer-reminders', '*/15 * * * *', $cron$select public.generate_customer_reminders();$cron$);

-- ---------------------------------------------------------------------
-- Delete account (customers only)
-- ---------------------------------------------------------------------
create or replace function public.customer_delete_account() returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := _require_customer();
begin
  if _is_internal_user(v_uid) then
    raise exception 'الحساب ده مرتبط بحساب تشغيلي ومينفعش يتحذف من هنا';
  end if;
  -- profile, saved passengers, notifications cascade; bookings/rentals/subscriptions keep their
  -- financial records and are simply unlinked (FK is ON DELETE SET NULL).
  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------
-- Grants: authenticated only
-- ---------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'customer_sync_account()', 'customer_claim_by_code(text)', 'customer_get_profile()',
    'customer_update_profile(text,text,text,boolean)', 'customer_list_passengers()',
    'customer_save_passenger(uuid,text,text,text)', 'customer_delete_passenger(uuid)',
    'customer_list_bookings(text,integer,integer)', 'customer_list_rentals()', 'customer_list_subscriptions()',
    'customer_list_payments(integer)', 'customer_get_overview()',
    'customer_list_notifications(integer,integer)', 'customer_mark_notifications_read(uuid[])',
    'customer_delete_account()'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

revoke all on function public._is_internal_user(uuid) from public, anon, authenticated;
revoke all on function public._require_customer() from public, anon, authenticated;
revoke all on function public._link_customer_on_insert() from public, anon, authenticated;
revoke all on function public._cust_notify(uuid, text, jsonb, text, text) from public, anon, authenticated;
revoke all on function public._cust_notif_booking_update() from public, anon, authenticated;
revoke all on function public._cust_notif_payment_review() from public, anon, authenticated;
revoke all on function public._cust_notif_subscription_payment() from public, anon, authenticated;
revoke all on function public._cust_notif_subscription_status() from public, anon, authenticated;
revoke all on function public._cust_notif_departure() from public, anon, authenticated;
revoke all on function public.generate_customer_reminders() from public, anon, authenticated;
