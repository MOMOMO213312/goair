-- ============================================================================
-- READ-ONLY. Run this BEFORE deploying the ecosystem-link frontend change
-- (src/lib/ecosystem-link.ts + the p_external_platform/p_pnr wiring in
-- src/lib/goair.ts).
--
-- Why this matters: the last time someone (previous Lovable prompt round)
-- guessed a schema/signature instead of checking it, every booking/payment
-- call broke in production. The frontend change here was deliberately
-- written with a safe fallback (it retries without these params if the RPC
-- rejects them — see isMissingEcosystemLinkParams in goair.ts), so it will
-- NOT break checkout even if this comes back empty. But confirm it here
-- anyway, because "it degrades safely" is not the same as "it works as
-- intended" — you want the TripRing tagging to actually land, not silently
-- no-op forever.
-- ============================================================================

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as returns
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('create_booking_safe', 'create_private_booking_safe');

-- Read the "arguments" column above for each function and confirm you see
-- BOTH:
--   p_external_platform text
--   p_pnr text  (or text default null — either is fine)
--
-- If you see them: deploy the frontend change as-is, then place one real
-- test booking with a URL like /?source=tripring&pnr=TEST123 and confirm
-- the resulting row in `external_links` has external_platform='tripring'.
--
-- If you do NOT see them: the migration mentioned in README §6
-- (create_booking_safe_add_external_link_params) either never ran or ran
-- against a different function overload. Do not chase this further from
-- the frontend — find out from whoever ran that migration what actually
-- landed, and re-run this script until the arguments list matches.
