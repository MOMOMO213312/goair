-- =====================================================================
-- Admin notification center (staff-facing, in-app)
--
--  * admin_notifications        : one row per event, visible to a set of staff roles
--  * admin_notification_reads   : per-staff read state
--  * triggers                   : create a notification when something needs staff attention
--  * generate_admin_time_alerts : cron-driven alerts (unassigned trips, stale payments) + retention
--  * RPCs                       : summary (cheap poll), list, mark-read
--
-- Design rules:
--  1. A notification failure must NEVER break the business write that caused it
--     (every insert goes through _push_admin_notification, which swallows errors).
--  2. Tables are locked (RLS on, no policies, no grants); the frontend only uses RPCs.
--  3. super_admin sees everything; other roles see rows whose target_roles include them.
-- =====================================================================

create table if not exists public.admin_notifications (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,
  severity     text not null default 'info' check (severity in ('info', 'warning', 'urgent')),
  title        text not null,
  body         text,
  link_path    text,
  entity_type  text,
  entity_id    uuid,
  target_roles text[] not null default array['super_admin']::text[],
  dedupe_key   text unique,
  created_at   timestamptz not null default now()
);

create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);

create table if not exists public.admin_notification_reads (
  notification_id uuid not null references public.admin_notifications (id) on delete cascade,
  staff_id        uuid not null references public.staff_access (id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, staff_id)
);

create index if not exists admin_notification_reads_staff_idx
  on public.admin_notification_reads (staff_id);

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;
revoke all on public.admin_notifications from anon, authenticated;
revoke all on public.admin_notification_reads from anon, authenticated;
grant all on public.admin_notifications to service_role;
grant all on public.admin_notification_reads to service_role;

-- ---------------------------------------------------------------------
-- Internal writer. Never raises.
-- ---------------------------------------------------------------------
create or replace function public._push_admin_notification(
  p_type        text,
  p_severity    text,
  p_title       text,
  p_body        text,
  p_link_path   text,
  p_entity_type text,
  p_entity_id   uuid,
  p_roles       text[],
  p_dedupe_key  text default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into admin_notifications
    (type, severity, title, body, link_path, entity_type, entity_id, target_roles, dedupe_key)
  values
    (p_type, coalesce(p_severity, 'info'), p_title, p_body, p_link_path, p_entity_type, p_entity_id,
     coalesce(p_roles, array['super_admin']::text[]), p_dedupe_key)
  on conflict (dedupe_key) do nothing;
exception when others then
  -- never block the caller because of a notification problem
  null;
end;
$$;

revoke all on function public._push_admin_notification(text, text, text, text, text, text, uuid, text[], text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Trigger functions (all defensive: they only call the non-raising writer)
-- ---------------------------------------------------------------------

-- New booking
create or replace function public._notif_booking_insert() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  perform _push_admin_notification(
    'booking_new', 'info', 'حجز جديد',
    format('%s — %s مقعد — تاريخ الرحلة %s%s',
           coalesce(new.full_name, 'عميل'), coalesce(new.seats_count, 1), coalesce(new.travel_date::text, '—'),
           case when new.ticket_code is not null then ' — تذكرة ' || new.ticket_code else '' end),
    '/admin', 'booking', new.id, array['ops', 'support'], 'booking_new:' || new.id::text);
  return new;
end;
$$;

-- Booking cancelled
create or replace function public._notif_booking_cancelled() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform _push_admin_notification(
      'booking_cancelled', 'warning', 'حجز اتلغى',
      format('%s — %s مقعد%s%s',
             coalesce(new.full_name, 'عميل'), coalesce(new.seats_count, 1),
             case when new.ticket_code is not null then ' — تذكرة ' || new.ticket_code else '' end,
             case when new.cancellation_reason is not null then ' — السبب: ' || new.cancellation_reason else '' end),
      '/admin', 'booking', new.id, array['ops', 'finance'], 'booking_cancelled:' || new.id::text);
  end if;
  return new;
end;
$$;

-- Payment waiting for review
create or replace function public._notif_payment_review() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  v_name text;
  v_ticket text;
begin
  if new.review_status = 'pending_review'
     and (tg_op = 'INSERT' or old.review_status is distinct from new.review_status) then
    select full_name, ticket_code into v_name, v_ticket from booking where id = new.booking_id;
    perform _push_admin_notification(
      'payment_review', 'warning', 'دفعة محتاجة مراجعة',
      format('%s — $%s عن طريق %s%s',
             coalesce(v_name, 'عميل'), coalesce(new.amount_usd::text, '—'), coalesce(new.method, '—'),
             case when v_ticket is not null then ' — تذكرة ' || v_ticket else '' end),
      '/admin', 'payment', new.id, array['finance'], 'payment_review:' || new.id::text);
  end if;
  return new;
end;
$$;

-- Subscription payment waiting for review
create or replace function public._notif_subscription_payment_review() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.review_status = 'pending_review'
     and (tg_op = 'INSERT' or old.review_status is distinct from new.review_status) then
    perform _push_admin_notification(
      'subscription_payment_review', 'warning', 'دفعة اشتراك محتاجة مراجعة',
      format('$%s عن طريق %s', coalesce(new.amount_usd::text, '—'), coalesce(new.method, '—')),
      '/admin/subscription-plans', 'subscription_payment', new.id, array['finance'],
      'subscription_payment_review:' || new.id::text);
  end if;
  return new;
end;
$$;

-- New custom trip request
create or replace function public._notif_custom_request() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  perform _push_admin_notification(
    'custom_request', 'info', 'طلب رحلة مخصصة',
    format('%s — %s — %s راكب', coalesce(new.passenger_name, 'عميل'), coalesce(new.route_name, '—'), coalesce(new.pax, 1)),
    '/admin/requests', 'custom_request', new.id, array['ops', 'support'], 'custom_request:' || new.id::text);
  return new;
end;
$$;

-- New contact message
create or replace function public._notif_contact_message() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  perform _push_admin_notification(
    'contact_message', 'info', 'رسالة تواصل جديدة',
    format('%s — %s', coalesce(new.full_name, 'زائر'), left(coalesce(new.message, ''), 120)),
    '/admin/requests', 'contact_message', new.id, array['support'], 'contact_message:' || new.id::text);
  return new;
end;
$$;

-- Rental provider application
create or replace function public._notif_rental_application() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status = 'pending_review' then
    perform _push_admin_notification(
      'rental_application', 'info', 'طلب انضمام تأجير جديد',
      format('%s — %s', coalesce(new.company_name, new.full_name, '—'), coalesce(new.country, '—')),
      '/admin/rental-applications', 'rental_application', new.id, array['ops'],
      'rental_application:' || new.id::text);
  end if;
  return new;
end;
$$;

-- Rental vehicle waiting for approval
create or replace function public._notif_rental_vehicle() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.approval_status = 'pending_review'
     and (tg_op = 'INSERT' or old.approval_status is distinct from new.approval_status) then
    perform _push_admin_notification(
      'rental_vehicle', 'info', 'عربية تأجير محتاجة مراجعة',
      format('%s — %s', coalesce(new.make_model, '—'), coalesce(new.plate_number, '—')),
      '/admin/rental-vehicles', 'rental_vehicle', new.id, array['ops'],
      'rental_vehicle:' || new.id::text);
  end if;
  return new;
end;
$$;

-- Low rating
create or replace function public._notif_low_rating() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.stars is not null and new.stars <= 2 then
    perform _push_admin_notification(
      'low_rating', 'warning', 'تقييم منخفض',
      format('%s من 5%s', new.stars, case when new.comment is not null then ' — ' || left(new.comment, 120) else '' end),
      '/admin/overview', 'rating', new.id, array['support', 'ops'], 'low_rating:' || new.id::text);
  end if;
  return new;
end;
$$;

-- Ground-handling incident
create or replace function public._notif_gh_incident() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  perform _push_admin_notification(
    'gh_incident', case when lower(coalesce(new.severity, '')) in ('high', 'critical', 'urgent') then 'urgent' else 'warning' end,
    'بلاغ تشغيل أرضي',
    left(coalesce(new.description, '—'), 160),
    '/admin/ground-handling', 'gh_incident', new.id, array['ops'], 'gh_incident:' || new.id::text);
  return new;
end;
$$;

-- Departure fell below the minimum
create or replace function public._notif_departure_below_min() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status = 'below_minimum' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform _push_admin_notification(
      'departure_below_minimum', 'warning', 'رحلة مشتركة تحت الحد الأدنى',
      format('رحلة يوم %s لم تكمل الحد الأدنى من الركاب', new.travel_date),
      '/admin', 'departure', null, array['ops'],
      'departure_below_minimum:' || new.schedule_id::text || ':' || new.travel_date::text);
  end if;
  return new;
end;
$$;

revoke all on function public._notif_booking_insert() from public, anon, authenticated;
revoke all on function public._notif_booking_cancelled() from public, anon, authenticated;
revoke all on function public._notif_payment_review() from public, anon, authenticated;
revoke all on function public._notif_subscription_payment_review() from public, anon, authenticated;
revoke all on function public._notif_custom_request() from public, anon, authenticated;
revoke all on function public._notif_contact_message() from public, anon, authenticated;
revoke all on function public._notif_rental_application() from public, anon, authenticated;
revoke all on function public._notif_rental_vehicle() from public, anon, authenticated;
revoke all on function public._notif_low_rating() from public, anon, authenticated;
revoke all on function public._notif_gh_incident() from public, anon, authenticated;
revoke all on function public._notif_departure_below_min() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
drop trigger if exists trg_notif_booking_insert on public.booking;
create trigger trg_notif_booking_insert after insert on public.booking
  for each row execute function public._notif_booking_insert();

drop trigger if exists trg_notif_booking_cancelled on public.booking;
create trigger trg_notif_booking_cancelled after update of status on public.booking
  for each row execute function public._notif_booking_cancelled();

drop trigger if exists trg_notif_payment_review on public.payments;
create trigger trg_notif_payment_review after insert or update of review_status on public.payments
  for each row execute function public._notif_payment_review();

drop trigger if exists trg_notif_subscription_payment_review on public.subscription_payments;
create trigger trg_notif_subscription_payment_review after insert or update of review_status on public.subscription_payments
  for each row execute function public._notif_subscription_payment_review();

drop trigger if exists trg_notif_custom_request on public.custom_requests;
create trigger trg_notif_custom_request after insert on public.custom_requests
  for each row execute function public._notif_custom_request();

drop trigger if exists trg_notif_contact_message on public.contact_messages;
create trigger trg_notif_contact_message after insert on public.contact_messages
  for each row execute function public._notif_contact_message();

drop trigger if exists trg_notif_rental_application on public.rental_partner_applications;
create trigger trg_notif_rental_application after insert on public.rental_partner_applications
  for each row execute function public._notif_rental_application();

drop trigger if exists trg_notif_rental_vehicle on public.rental_vehicles;
create trigger trg_notif_rental_vehicle after insert or update of approval_status on public.rental_vehicles
  for each row execute function public._notif_rental_vehicle();

drop trigger if exists trg_notif_low_rating on public.ratings;
create trigger trg_notif_low_rating after insert on public.ratings
  for each row execute function public._notif_low_rating();

drop trigger if exists trg_notif_gh_incident on public.ground_handling_incidents;
create trigger trg_notif_gh_incident after insert on public.ground_handling_incidents
  for each row execute function public._notif_gh_incident();

drop trigger if exists trg_notif_departure_below_min on public.departure_status;
create trigger trg_notif_departure_below_min after insert or update of status on public.departure_status
  for each row execute function public._notif_departure_below_min();

-- ---------------------------------------------------------------------
-- Time-based alerts + retention (run by pg_cron every 15 minutes)
-- ---------------------------------------------------------------------
create or replace function public.generate_admin_time_alerts() returns void
language plpgsql security definer set search_path to 'public' as $$
declare
  r record;
begin
  -- Confirmed bookings departing within 24h with no driver/vehicle assignment
  for r in
    select b.id, b.full_name, b.ticket_code, b.travel_datetime
      from booking b
     where b.status = 'confirmed'
       and b.trip_assignment_id is null
       and b.travel_datetime is not null
       and b.travel_datetime > now()
       and b.travel_datetime <= now() + interval '24 hours'
  loop
    perform _push_admin_notification(
      'unassigned_soon', 'urgent', 'حجز قريب من غير سائق',
      format('%s%s — الرحلة خلال أقل من 24 ساعة ولسه من غير تخصيص سائق/عربية',
             coalesce(r.full_name, 'عميل'),
             case when r.ticket_code is not null then ' (تذكرة ' || r.ticket_code || ')' else '' end),
      '/admin', 'booking', r.id, array['ops'], 'unassigned_soon:' || r.id::text);
  end loop;

  -- Payments waiting for review for more than 6 hours
  for r in
    select p.id, p.amount_usd, p.method
      from payments p
     where p.review_status = 'pending_review'
       and p.created_at < now() - interval '6 hours'
  loop
    perform _push_admin_notification(
      'payment_stale', 'urgent', 'دفعة متأخرة في المراجعة',
      format('دفعة $%s (%s) مستنية مراجعة من أكتر من 6 ساعات', coalesce(r.amount_usd::text, '—'), coalesce(r.method, '—')),
      '/admin', 'payment', r.id, array['finance'], 'payment_stale:' || r.id::text);
  end loop;

  -- Retention: keep 90 days
  delete from admin_notifications where created_at < now() - interval '90 days';
exception when others then
  null;
end;
$$;

revoke all on function public.generate_admin_time_alerts() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('goair-admin-time-alerts');
exception when others then
  null;
end;
$$;

select cron.schedule('goair-admin-time-alerts', '*/15 * * * *', $cron$select public.generate_admin_time_alerts();$cron$);

-- ---------------------------------------------------------------------
-- Staff-facing RPCs
-- ---------------------------------------------------------------------

create or replace function public.admin_get_notification_summary(p_access_token text)
returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_staff uuid;
  v_role  text;
  v_unread bigint;
  v_urgent bigint;
  v_latest timestamptz;
begin
  select id, role into v_staff, v_role
    from staff_access where is_active = true and auth_user_id = auth.uid();
  if v_staff is null then
    raise exception 'رمز الدخول غير صحيح أو الحساب غير مفعّل';
  end if;

  select count(*), count(*) filter (where n.severity = 'urgent'), max(n.created_at)
    into v_unread, v_urgent, v_latest
    from admin_notifications n
   where (v_role = 'super_admin' or v_role = any (n.target_roles))
     and not exists (select 1 from admin_notification_reads r where r.notification_id = n.id and r.staff_id = v_staff);

  return jsonb_build_object('unread_count', v_unread, 'urgent_unread_count', v_urgent, 'latest_unread_at', v_latest);
end;
$$;

create or replace function public.admin_list_notifications(
  p_access_token text,
  p_limit        int     default 30,
  p_offset       int     default 0,
  p_unread_only  boolean default false
) returns table (
  id          uuid,
  type        text,
  severity    text,
  title       text,
  body        text,
  link_path   text,
  created_at  timestamptz,
  is_read     boolean
)
language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_staff uuid;
  v_role  text;
begin
  select s.id, s.role into v_staff, v_role
    from staff_access s where s.is_active = true and s.auth_user_id = auth.uid();
  if v_staff is null then
    raise exception 'رمز الدخول غير صحيح أو الحساب غير مفعّل';
  end if;

  return query
  select n.id, n.type, n.severity, n.title, n.body, n.link_path, n.created_at,
         exists (select 1 from admin_notification_reads r where r.notification_id = n.id and r.staff_id = v_staff) as is_read
    from admin_notifications n
   where (v_role = 'super_admin' or v_role = any (n.target_roles))
     and (not p_unread_only
          or not exists (select 1 from admin_notification_reads r where r.notification_id = n.id and r.staff_id = v_staff))
   order by n.created_at desc
   limit greatest(1, least(coalesce(p_limit, 30), 100))
   offset greatest(0, coalesce(p_offset, 0));
end;
$$;

-- p_ids = null  -> mark every visible notification as read
create or replace function public.admin_mark_notifications_read(p_access_token text, p_ids uuid[] default null)
returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  v_staff uuid;
  v_role  text;
  v_count integer;
begin
  select id, role into v_staff, v_role
    from staff_access where is_active = true and auth_user_id = auth.uid();
  if v_staff is null then
    raise exception 'رمز الدخول غير صحيح أو الحساب غير مفعّل';
  end if;

  with ins as (
    insert into admin_notification_reads (notification_id, staff_id)
    select n.id, v_staff
      from admin_notifications n
     where (v_role = 'super_admin' or v_role = any (n.target_roles))
       and (p_ids is null or n.id = any (p_ids))
    on conflict do nothing
    returning 1
  )
  select count(*) into v_count from ins;

  return v_count;
end;
$$;

revoke all on function public.admin_get_notification_summary(text) from public, anon;
revoke all on function public.admin_list_notifications(text, int, int, boolean) from public, anon;
revoke all on function public.admin_mark_notifications_read(text, uuid[]) from public, anon;
grant execute on function public.admin_get_notification_summary(text) to authenticated;
grant execute on function public.admin_list_notifications(text, int, int, boolean) to authenticated;
grant execute on function public.admin_mark_notifications_read(text, uuid[]) to authenticated;
