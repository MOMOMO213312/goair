-- شركة النقل مبقتش تشوف سعر العميل (display_price_usd) ولا اسم المشغّل المنافس.
-- بدلهم: other_operator_active (boolean) يقول بس هل الخط مشغّل من شركة تانية.
-- الدالة بقت للـ authenticated بس (اتسحبت من anon/public).
-- متطبّقة على الإنتاج بتاريخ 2026-09-28.

drop function if exists public.operator_list_trip_lines(text);

create function public.operator_list_trip_lines(p_access_token text)
 returns table(
   trip_option_id uuid, country text, airport_name text, origin text, destination text,
   vehicle_label_ar text, booking_type text, my_rate_usd numeric, my_rate_is_active boolean,
   other_operator_active boolean
 )
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_operator_id uuid;
begin
  v_operator_id := is_valid_operator_token(p_access_token);
  if v_operator_id is null then
    raise exception 'رمز الدخول غير صحيح أو الحساب غير مفعّل';
  end if;

  return query
  select
    o.id as trip_option_id,
    t.country,
    t.airport_name,
    t.origin,
    t.destination,
    vt.label_ar as vehicle_label_ar,
    o.booking_type,
    r.supplier_cost_usd as my_rate_usd,
    coalesce(r.is_active, false) as my_rate_is_active,
    (o.active_operator_id is not null and o.active_operator_id is distinct from v_operator_id) as other_operator_active
  from trip_options o
  join trip t on t.id = o.trip_id
  join vehicle_types vt on vt.id = o.vehicle_type_id
  left join trip_option_operator_rates r on r.trip_option_id = o.id and r.operator_id = v_operator_id
  where o.is_active = true
  order by t.country, t.origin, t.destination, vt.code, o.booking_type;
end;
$function$;

revoke all on function public.operator_list_trip_lines(text) from public, anon;
grant execute on function public.operator_list_trip_lines(text) to authenticated;
