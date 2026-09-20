-- Frontend upper-cases ticket codes; new tickets are lowercase hex, so exact matching made every
-- new booking "not found" on /payment, /confirmation, /my-bookings. Only the comparison changed.
CREATE OR REPLACE FUNCTION public.get_booking_by_ticket(p_ticket_code text)
 RETURNS TABLE(id uuid, full_name text, status text, travel_date date, travel_datetime timestamp with time zone, seats_count integer, meeting_point text, luggage_count integer, invoice_number bigint, driver_name text, driver_phone text, vehicle_plate text, passenger_names text[])
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select b.id, b.full_name, b.status, b.travel_date, b.travel_datetime,
         b.seats_count, b.meeting_point, b.luggage_count, b.invoice_number,
         d.full_name, d.phone_number, v.plate_number,
         coalesce((select array_agg(bp.full_name order by bp.created_at) from booking_passengers bp where bp.booking_id = b.id), array[]::text[])
  from booking b
  left join trip_assignments ta on ta.id = b.trip_assignment_id
  left join drivers d on d.id = ta.driver_id
  left join vehicles v on v.id = ta.vehicle_id
  where lower(b.ticket_code) = lower(btrim(p_ticket_code));
$function$;

CREATE OR REPLACE FUNCTION public.get_booking_rating_eligibility(p_ticket_code text)
 RETURNS TABLE(booking_id uuid, can_rate boolean, already_rated boolean, existing_stars integer, existing_comment text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select b.id,
    (b.status = 'confirmed' and b.cancelled_at is null and b.travel_datetime < now() and r.id is null),
    (r.id is not null), r.stars, r.comment
  from booking b left join ratings r on r.booking_id = b.id
  where lower(b.ticket_code) = lower(btrim(p_ticket_code));
$function$;

CREATE OR REPLACE FUNCTION public.get_driver_location_by_ticket(p_ticket_code text)
 RETURNS TABLE(latitude double precision, longitude double precision, updated_at timestamp with time zone)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select l.latitude, l.longitude, l.updated_at
  from booking b join trip_driver_locations l on l.trip_assignment_id = b.trip_assignment_id
  where lower(b.ticket_code) = lower(btrim(p_ticket_code))
    and l.updated_at > now() - interval '15 minutes';
$function$;

CREATE OR REPLACE FUNCTION public.submit_customer_rating_safe(p_ticket_code text, p_stars integer, p_comment text DEFAULT NULL::text)
 RETURNS TABLE(out_id uuid, out_stars integer, out_comment text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_booking record; v_rating_id uuid;
begin
  if p_stars is null or p_stars < 1 or p_stars > 5 then
    raise exception 'التقييم لازم يكون من نجمة لخمس نجوم.';
  end if;
  select b.id, b.status, b.cancelled_at, b.travel_datetime, b.partner_id,
         b.sales_partner_id, b.sales_partner_type, b.agency_id
  into v_booking from booking b where lower(b.ticket_code) = lower(btrim(p_ticket_code));
  if v_booking.id is null then raise exception 'مش لاقيين حجز بكود التذكرة ده.'; end if;
  if v_booking.status <> 'confirmed' or v_booking.cancelled_at is not null then
    raise exception 'الرحلة دي لسه مش مؤكدة أو اتلغت — مينفعش تقييمها.';
  end if;
  if v_booking.travel_datetime is null or v_booking.travel_datetime >= now() then
    raise exception 'تقدر تقيّم الرحلة بعد موعدها بس.';
  end if;
  if exists (select 1 from ratings where booking_id = v_booking.id) then
    raise exception 'الرحلة دي اتقيّمت قبل كده.';
  end if;
  insert into public.ratings (booking_id, stars, comment, partner_id, sales_partner_id, sales_partner_type, agency_id)
  values (v_booking.id, p_stars, nullif(trim(coalesce(p_comment, '')), ''), v_booking.partner_id, v_booking.sales_partner_id, v_booking.sales_partner_type, v_booking.agency_id)
  returning id into v_rating_id;
  return query select r.id, r.stars, r.comment from ratings r where r.id = v_rating_id;
end;
$function$;
