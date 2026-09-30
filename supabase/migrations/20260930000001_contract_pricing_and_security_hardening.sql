-- Applied live on project cvrjaprlnkutocvbnjhc on 2026-09-30 (documentation copy).
-- 1) revoke EXECUTE on internal _* functions from anon/authenticated/PUBLIC
--    (_agent_can_manage_service, _auto_assign_private_booking, _calculate_ground_handling_commission,
--     _create_round_trip_leg, _extract_airline_code, _resolve_airline, _resolve_exclusive_ground_handling_partner,
--     _throttle_contact_messages, _throttle_custom_requests, _throttle_newsletter_subscribers, _throttle_rental_partner_applications)
-- 2) hide trip_options.active_operator_id from anon/authenticated
REVOKE SELECT (active_operator_id) ON public.trip_options FROM anon, authenticated;
-- 3) contract pricing: new basis per_trip
ALTER TABLE public.airline_contract_rate_lines DROP CONSTRAINT IF EXISTS airline_contract_rate_lines_pricing_basis_check;
ALTER TABLE public.airline_contract_rate_lines ADD CONSTRAINT airline_contract_rate_lines_pricing_basis_check
  CHECK (pricing_basis = ANY (ARRAY['per_vehicle','per_passenger','per_trip','tiered']));
-- 4) create_booking_safe / create_private_booking_safe were patched live:
--    contract prices (per_passenger/per_trip shared; per_vehicle/per_trip/per_passenger private) apply only to an
--    authenticated partner_portal booking; private bookings may use a contract-only vehicle (e.g. bus) when the
--    route has no public private price. See the live function definitions for the source of truth.
