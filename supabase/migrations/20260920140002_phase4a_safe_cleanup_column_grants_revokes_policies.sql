-- 1) rental_vehicles: API roles read ONLY the columns the site selects.
revoke select on public.rental_vehicles from anon, authenticated;
grant select (
  id, category_id, country, city, pickup_area_id, pickup_area_custom, make_model, photos,
  description, hourly_rate_usd, daily_rate_usd, multi_day_rate_usd, multi_day_threshold_days,
  min_rental_hours, transmission, fuel_type, seats, daily_mileage_limit_km, insurance_included,
  approval_status, is_active, created_at
) on public.rental_vehicles to anon, authenticated;

-- 2) Internal helpers that leak commission / payout / market data (internal callers are SECURITY DEFINER).
revoke execute on function public.attach_booking_addons(text, uuid[], uuid[]) from public, anon, authenticated;
revoke execute on function public.effective_rental_commission_rate(uuid) from public, anon, authenticated;
revoke execute on function public.effective_transport_payout_bonus_percent(uuid) from public, anon, authenticated;
revoke execute on function public.calculate_market_average_price(text, text) from public, anon, authenticated;

-- 3) TRUNCATE / TRIGGER / REFERENCES are never needed by API roles.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c where c.relnamespace='public'::regnamespace and c.relkind in ('r','p') loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;
revoke truncate on public.financial_ledger_entries from service_role;
revoke truncate on public.audit_logs from service_role;
revoke truncate, trigger, references on public.daily_passenger_manifest, public.dispatch_suggestions, public.needs_dispatch from anon, authenticated;

-- 4) Latent wide-open policies (role public, USING true); service_role bypasses RLS anyway.
drop policy if exists "service role full access group_statements" on public.group_statements;
drop policy if exists "service role full access portal_members" on public.portal_members;
drop policy if exists "service role full access travel_groups" on public.travel_groups;
