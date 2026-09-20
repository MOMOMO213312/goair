-- Sanctioned write path for subscription payments (identity = subscription code).
-- Additive: the old direct INSERT policy on subscription_payments is NOT removed here.
create or replace function public.submit_subscription_payment_safe(
  p_subscription_code text, p_method text, p_amount_usd numeric,
  p_reference_number text default null, p_proof_url text default null
) returns uuid
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_sub record; v_country text; v_payment_id uuid;
  v_ref text := nullif(btrim(p_reference_number), '');
  v_proof text := nullif(btrim(p_proof_url), '');
begin
  if p_subscription_code is null or btrim(p_subscription_code) = '' then raise exception 'كود الاشتراك مطلوب'; end if;
  if p_amount_usd is null or p_amount_usd < 0 then raise exception 'المبلغ غير صالح'; end if;
  if v_ref is not null and length(v_ref) > 100 then raise exception 'رقم المرجع طويل جدًا'; end if;
  if v_proof is not null and (length(v_proof) > 500 or v_proof !~ '^(https://|[A-Za-z0-9_.-]+/)') then
    raise exception 'رابط إثبات الدفع غير صالح';
  end if;

  select cs.id, cs.status, cs.expected_total_usd, cs.plan_id into v_sub
    from customer_subscriptions cs where lower(cs.subscription_code) = lower(btrim(p_subscription_code)) for update;

  if v_sub.id is null then raise exception 'مش لاقيين اشتراك بالكود ده'; end if;
  if v_sub.status <> 'pending_payment' then raise exception 'الاشتراك ده مش في حالة انتظار دفع (%)', v_sub.status; end if;
  if v_sub.expected_total_usd is null then raise exception 'الاشتراك ده مالوش مبلغ مؤكد — كلّم الدعم'; end if;
  if abs(p_amount_usd - v_sub.expected_total_usd) > 0.5 then
    raise exception 'المبلغ المرسل (%) مش مطابق للمبلغ المطلوب (%)', p_amount_usd, v_sub.expected_total_usd;
  end if;

  select sp.country into v_country from subscription_plans sp where sp.id = v_sub.plan_id;
  if not exists (select 1 from payment_settings ps where ps.method = p_method and ps.is_active = true
                 and (ps.country is null or ps.country = v_country)) then
    raise exception 'طريقة الدفع دي مش متاحة للبلد ده';
  end if;

  if exists (select 1 from subscription_payments p where p.subscription_id = v_sub.id
             and p.review_status in ('pending_review','confirmed')) then
    raise exception 'فيه دفعة قيد المراجعة أو مؤكدة للاشتراك ده بالفعل';
  end if;

  insert into subscription_payments (subscription_id, method, amount_usd, reference_number, proof_url)
  values (v_sub.id, p_method, p_amount_usd, v_ref, v_proof) returning id into v_payment_id;
  return v_payment_id;
end;
$$;
revoke all on function public.submit_subscription_payment_safe(text,text,numeric,text,text) from public;
grant execute on function public.submit_subscription_payment_safe(text,text,numeric,text,text) to anon, authenticated;
