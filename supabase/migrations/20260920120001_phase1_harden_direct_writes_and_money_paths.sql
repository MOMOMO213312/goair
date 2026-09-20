-- GoAir — Phase 1 / Migration 1
-- إغلاق الكتابة المباشرة من anon، وضمان سلامة مسارات الفلوس والإلغاء.

-- ============================================================
-- 1) إغلاق الكتابة المباشرة على booking و ratings (الفرونت بيستخدم RPC فقط)
-- ============================================================
drop policy if exists booking_public_insert on public.booking;
drop policy if exists "anon can insert own rating" on public.ratings;

revoke insert, update, delete, truncate, references, trigger on public.booking from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.ratings from anon, authenticated;
-- payments: الإدخال لسه مفتوح (الفرونت بيكتب مباشرة لحد ما نعمل RPC بديل)، لكن نقفل التعديل والصلاحيات الزيادة
revoke update, delete, truncate, references, trigger on public.payments from anon, authenticated;

-- ============================================================
-- 2) قيود سلامة على الحجز
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.booking'::regclass and conname = 'booking_seats_count_positive') then
    alter table public.booking add constraint booking_seats_count_positive check (seats_count > 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.booking'::regclass and conname = 'booking_expected_total_nonnegative') then
    alter table public.booking add constraint booking_expected_total_nonnegative check (expected_total_usd is null or expected_total_usd >= 0);
  end if;
end
$$;

-- ============================================================
-- 3) تأكيد الدفع: idempotent + مفيش توكن في الـledger + العملة USD (المبلغ amount_usd)
-- ============================================================
create or replace function public.admin_confirm_payment(p_access_token text, p_payment_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_booking_id uuid;
  v_amount numeric;
  v_method text;
  v_status text;
  v_actor record;
  v_actor_ref text;
begin
  if not staff_has_role(p_access_token, 'super_admin', 'finance') then
    raise exception 'ما عندكش صلاحية لمراجعة المدفوعات';
  end if;

  select booking_id, amount_usd, method, review_status
    into v_booking_id, v_amount, v_method, v_status
    from payments
   where id = p_payment_id
   for update;

  if v_booking_id is null then
    raise exception 'الدفعة غير موجودة';
  end if;

  if v_status is distinct from 'pending_review' then
    raise exception 'الدفعة دي اتراجعت قبل كده (الحالة الحالية: %)', v_status;
  end if;

  if exists (
    select 1 from payments
     where booking_id = v_booking_id and review_status = 'confirmed' and id <> p_payment_id
  ) then
    raise exception 'الحجز ده عليه دفعة مؤكدة بالفعل — راجعها قبل تأكيد دفعة تانية';
  end if;

  select * into v_actor from public._resolve_staff_actor(p_access_token);
  v_actor_ref := coalesce('staff:' || v_actor.staff_id::text, 'staff');

  update payments
     set review_status = 'confirmed', reviewed_at = now()
   where id = p_payment_id;

  update booking
     set status = 'confirmed'
   where id = v_booking_id and status = 'pending';

  -- لو الحجز اتلغى قبل تأكيد الدفعة، لازم يبقى قابل للاسترداد
  update booking
     set refund_status = 'pending'
   where id = v_booking_id and status = 'cancelled' and refund_status = 'not_applicable';

  perform public._record_ledger_entry(
    'booking_charge', 'customer', v_method, 'goair', 'payments:' || p_payment_id::text,
    v_amount, 'USD', 'booking', v_booking_id,
    'Payment confirmed by staff', v_actor_ref
  );

  perform public._record_audit_log(
    'staff', v_actor.staff_id, v_actor.staff_role, 'payment.confirm', 'payment', p_payment_id,
    jsonb_build_object('review_status', 'pending_review'),
    jsonb_build_object('review_status', 'confirmed', 'booking_id', v_booking_id, 'amount_usd', v_amount),
    null
  );
end;
$function$;

-- ============================================================
-- 4) الاسترداد: لازم دفعة مؤكدة، والسقف = اللي اتدفع فعلًا، ومفيش توكن في الـledger
-- ============================================================
create or replace function public.admin_process_refund(p_access_token text, p_booking_id uuid, p_amount numeric, p_reason text default null::text)
 returns table(refund_ledger_id uuid, remaining_after numeric, booking_refund_status text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_booking record;
  v_already_refunded numeric;
  v_paid numeric;
  v_chargeable_total numeric;
  v_remaining numeric;
  v_ledger_id uuid;
  v_new_status text;
  v_actor record;
  v_actor_ref text;
begin
  if not staff_has_role(p_access_token, 'super_admin', 'finance') then
    raise exception 'ما عندكش صلاحية لمعالجة المبالغ المستردة';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'المبلغ المسترد لازم يكون رقم موجب';
  end if;

  select id, currency, expected_total_usd, refund_status, status
    into v_booking
    from booking
   where id = p_booking_id
   for update;

  if v_booking.id is null then
    raise exception 'الحجز ده مش موجود';
  end if;

  if v_booking.refund_status not in ('pending', 'refunded') then
    raise exception 'الحجز ده مش في حالة تسمح بالاسترداد (refund_status = %)', v_booking.refund_status;
  end if;

  select coalesce(sum(amount_usd), 0) into v_paid
    from payments
   where booking_id = p_booking_id and review_status = 'confirmed';

  if v_paid <= 0 then
    raise exception 'مفيش دفعة مؤكدة للحجز ده — مينفعش يتعمل استرداد';
  end if;

  select coalesce(sum(amount), 0) into v_already_refunded
    from financial_ledger_entries
   where related_table = 'booking' and related_id = p_booking_id
     and entry_type = 'booking_refund' and status = 'recorded';

  v_chargeable_total := least(coalesce(v_booking.expected_total_usd, v_paid), v_paid);
  v_remaining := v_chargeable_total - v_already_refunded;

  if p_amount > v_remaining + 0.5 then
    raise exception 'المبلغ (%) أكبر من المتبقي القابل للاسترداد (%)', p_amount, v_remaining;
  end if;

  select * into v_actor from public._resolve_staff_actor(p_access_token);
  v_actor_ref := coalesce('staff:' || v_actor.staff_id::text, 'staff');

  v_ledger_id := public._record_ledger_entry(
    'booking_refund', 'goair', 'goair_gateway', 'customer', 'booking:' || p_booking_id::text,
    p_amount, 'USD', 'booking', p_booking_id,
    p_reason, v_actor_ref
  );

  v_remaining := v_remaining - p_amount;
  v_new_status := case when v_remaining <= 0.5 then 'refunded' else 'pending' end;

  update booking set refund_status = v_new_status where id = p_booking_id;

  perform public._record_audit_log(
    'staff', v_actor.staff_id, v_actor.staff_role, 'refund.process', 'booking', p_booking_id,
    jsonb_build_object('refund_status', v_booking.refund_status),
    jsonb_build_object('refund_status', v_new_status, 'amount', p_amount, 'ledger_id', v_ledger_id),
    p_reason
  );

  return query select v_ledger_id, greatest(v_remaining, 0), v_new_status;
end;
$function$;

-- ============================================================
-- 5) إلغاء العميل بالتذكرة: نافذة زمنية + حالة الرحلة + استرداد فقط لو في دفعة مؤكدة + استرجاع رصيد الاشتراك
--    (شرائح نسب الاسترداد لسه مستنية قرار العمل — المبلغ بيتحدد بواسطة admin_process_refund)
-- ============================================================
create or replace function public.cancel_booking_by_ticket(p_ticket_code text, p_reason text)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_b record;
  v_op_status text;
  v_paid boolean;
  v_refund_status text;
  v_code text := btrim(p_ticket_code);
begin
  select b.id, b.status, b.travel_datetime, b.travel_date, b.trip_assignment_id,
         b.used_free_ride_credit, b.subscription_id
    into v_b
    from booking b
   where b.ticket_code = v_code
      or b.ticket_code = upper(v_code)
      or b.ticket_code = lower(v_code)
   limit 1
   for update of b;

  if v_b.id is null or v_b.status = 'cancelled' then
    return false;
  end if;

  if coalesce(v_b.travel_datetime, (v_b.travel_date + 1)::timestamptz) <= now() then
    raise exception 'مينفعش تلغي حجز موعده عدّى — كلم الدعم';
  end if;

  if v_b.trip_assignment_id is not null then
    select operator_status into v_op_status from trip_assignments where id = v_b.trip_assignment_id;
    if v_op_status in ('on_the_way', 'picked_up', 'completed', 'no_show') then
      raise exception 'الرحلة بدأت بالفعل — كلم الدعم';
    end if;
  end if;

  v_paid := exists (
    select 1 from payments where booking_id = v_b.id and review_status = 'confirmed'
  );
  v_refund_status := case when v_paid then 'pending' else 'not_applicable' end;

  update booking
     set status = 'cancelled',
         cancellation_reason = p_reason,
         cancelled_at = now(),
         refund_status = v_refund_status
   where id = v_b.id;

  if v_b.used_free_ride_credit and v_b.subscription_id is not null then
    update customer_subscriptions
       set ride_credits_remaining = ride_credits_remaining + 1, updated_at = now()
     where id = v_b.subscription_id;
  end if;

  perform public._record_audit_log(
    'customer', null, null, 'booking.cancel_customer', 'booking', v_b.id,
    null, jsonb_build_object('status', 'cancelled', 'refund_status', v_refund_status), p_reason
  );

  return true;
end;
$function$;
