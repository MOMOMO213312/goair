-- Edge functions (admin-staff-accounts, portal-members, send-booking-confirmation)
-- use the service_role key, which bypasses RLS but still needs table GRANTs.
-- Minimal, per-table, no DELETE, no UPDATE except where the code updates.
grant select, insert, update on public.staff_access to service_role;
grant select, insert on public.portal_members to service_role;
grant select on public.transport_operators   to service_role;
grant select on public.travel_agencies       to service_role;
grant select on public.airline_partners      to service_role;
grant select on public.ground_handling_partners to service_role;
grant select on public.rental_partners       to service_role;
grant select on public.booking to service_role;
grant select on public.trip    to service_role;
grant select, insert on public.notifications_log to service_role;
grant insert on public.audit_logs to service_role;
