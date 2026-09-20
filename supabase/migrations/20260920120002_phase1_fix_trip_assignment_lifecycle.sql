-- GoAir — Phase 1 / Migration 2
-- إصلاح دورة حياة الـassignment: رفض/إلغاء المشغّل مايسيبش عملاء بدون سيارة.

-- 1) UNIQUE(schedule_id, travel_date) -> unique جزئي على الـassignments النشطة فقط
alter table public.trip_assignments
  drop constraint if exists trip_assignments_schedule_id_travel_date_key;

create unique index if not exists trip_assignments_active_slot_uidx
  on public.trip_assignments (schedule_id, travel_date)
  where operator_status not in ('cancelled', 'rejected');

-- 2) تنظيف: أي حجز لسه مربوط بـassignment ملغي/مرفوض يرجع لطابور غير المُعيَّن
update public.booking b
   set trip_assignment_id = null
  from public.trip_assignments ta
 where b.trip_assignment_id = ta.id
   and ta.operator_status in ('cancelled', 'rejected')
   and b.status <> 'cancelled';

-- 3) التعيين التلقائي: يتجاهل الـassignments الملغية/المرفوضة، ومايرجّعش لنفس المركبة اللي اترفضت، ويربط باقي الحجوزات غير المُعيَّنة
create or replace function public.auto_assign_trip_for_booking()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_assignment_id uuid;
  v_vehicle_id uuid;
  v_driver_id uuid;
  v_vehicle_type_id uuid;
  v_trip_country text;
  v_vehicle_operator_id uuid;
  v_selling_operator_id uuid;
begin
  if new.trip_assignment_id is not null or new.schedule_id is null then
    return new;
  end if;

  select id into v_assignment_id
  from trip_assignments
  where schedule_id = new.schedule_id
    and travel_date = new.travel_date
    and operator_status not in ('cancelled', 'rejected')
  limit 1;

  if v_assignment_id is null then
    if new.sales_partner_type = 'operator' then
      select p.linked_transport_operator_id into v_selling_operator_id
      from partners p where p.id = new.sales_partner_id;
    end if;

    select s.vehicle_type_id, t.country into v_vehicle_type_id, v_trip_country
    from schedules s
    join trip t on t.id = s.trip_id
    where s.id = new.schedule_id;

    select v.id, v.driver_id, v.operator_id
    into v_vehicle_id, v_driver_id, v_vehicle_operator_id
    from vehicles v
    left join drivers vd on vd.id = v.driver_id
    where v.is_active = true
      and (v_vehicle_type_id is null or v.vehicle_type_id = v_vehicle_type_id)
      and (v_trip_country is null or v.country = v_trip_country)
      and (v_selling_operator_id is null or v.operator_id = v_selling_operator_id)
      and (v.registration_expiry is null or v.registration_expiry >= new.travel_date)
      and (v.insurance_expiry is null or v.insurance_expiry >= new.travel_date)
      and (v.driver_id is null or vd.license_expiry is null or vd.license_expiry >= new.travel_date)
      and v.id not in (
        select ta.vehicle_id from trip_assignments ta
        where ta.travel_date = new.travel_date and ta.vehicle_id is not null
          and ta.operator_status not in ('cancelled', 'rejected')
      )
      and v.id not in (
        select ta.vehicle_id from trip_assignments ta
        where ta.schedule_id = new.schedule_id and ta.travel_date = new.travel_date
          and ta.vehicle_id is not null
      )
    order by v.plate_number
    limit 1;

    if v_vehicle_id is null then
      return new;
    end if;

    if v_driver_id is null then
      select d.id into v_driver_id from drivers d
      where d.is_active = true
        and (d.license_expiry is null or d.license_expiry >= new.travel_date)
        and (d.operator_id is null or d.operator_id = v_vehicle_operator_id)
        and d.id not in (
          select ta.driver_id from trip_assignments ta
          where ta.travel_date = new.travel_date and ta.driver_id is not null
            and ta.operator_status not in ('cancelled', 'rejected')
        )
      order by d.full_name
      limit 1;
    end if;

    insert into trip_assignments (schedule_id, travel_date, vehicle_id, driver_id)
    values (new.schedule_id, new.travel_date, v_vehicle_id, v_driver_id)
    returning id into v_assignment_id;

    -- الحجوزات الأقدم على نفس الموعد اللي فضلت من غير تعيين (مثلًا بعد رفض مشغّل) تتربط بالتعيين الجديد
    if v_selling_operator_id is null then
      update booking
         set trip_assignment_id = v_assignment_id
       where schedule_id = new.schedule_id
         and travel_date = new.travel_date
         and trip_assignment_id is null
         and status <> 'cancelled';
    end if;
  end if;

  update booking set trip_assignment_id = v_assignment_id where id = new.id;
  return new;
end;
$function$;

-- 4) الرفض (rejected) زي الإلغاء: يفك الحجوزات ويبلّغ العمليات
create or replace function public.operator_set_trip_status(p_access_token text, p_assignment_id uuid, p_status text, p_note text default null::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_op_id uuid;
  v_current text;
  v_allowed text[];
  v_freed integer := 0;
  v_slot record;
begin
  v_op_id := is_valid_operator_token(p_access_token);
  if v_op_id is null then raise exception 'رمز الدخول غير صحيح أو الحساب غير مفعّل'; end if;

  select ta.operator_status into v_current
  from trip_assignments ta
  join vehicles v on v.id = ta.vehicle_id
  where ta.id = p_assignment_id and v.operator_id = v_op_id
  for update of ta;

  if v_current is null then
    raise exception 'الرحلة دي مش تابعة لأسطولك';
  end if;

  v_allowed := case v_current
    when 'pending' then array['accepted','rejected']
    when 'accepted' then array['on_the_way','delayed','vehicle_issue','driver_change','cancelled','no_show']
    when 'on_the_way' then array['picked_up','delayed','vehicle_issue','driver_change','cancelled','no_show']
    when 'picked_up' then array['completed','delayed']
    when 'delayed' then array['on_the_way','picked_up','completed','cancelled']
    when 'vehicle_issue' then array['on_the_way','driver_change','cancelled']
    when 'driver_change' then array['on_the_way','picked_up']
    else array[]::text[]
  end;

  if not (p_status = ANY(v_allowed)) then
    raise exception 'مينفعش تتغير الحالة من % لـ %', v_current, p_status;
  end if;

  if p_status in ('delayed','vehicle_issue','driver_change','cancelled','no_show')
     and (p_note is null or btrim(p_note) = '') then
    raise exception 'لازم تكتب سبب/ملاحظة للحالة دي';
  end if;

  update trip_assignments
  set operator_status = p_status,
      status_note = coalesce(nullif(btrim(p_note), ''), status_note),
      status_updated_at = now()
  where id = p_assignment_id;

  if p_status in ('cancelled', 'rejected') then
    update booking
    set trip_assignment_id = null
    where trip_assignment_id = p_assignment_id
      and status <> 'cancelled';
    get diagnostics v_freed = row_count;

    select ta.schedule_id, ta.travel_date into v_slot from trip_assignments ta where ta.id = p_assignment_id;
    begin
      perform public._ops_telegram_send(
        '⚠️ مشغّل ' || case when p_status = 'rejected' then 'رفض' else 'ألغى' end || ' رحلة' || E'\n' ||
        'التاريخ: ' || coalesce(v_slot.travel_date::text, '-') || E'\n' ||
        'حجوزات محتاجة إعادة تعيين: ' || v_freed::text || E'\n' ||
        'https://goair-iota.vercel.app/admin'
      );
    exception when others then
      null;
    end;
  end if;
end;
$function$;
