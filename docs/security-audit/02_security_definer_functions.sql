-- ============================================================================
-- READ-ONLY. Safe to run in Supabase SQL Editor.
--
-- Purpose: turn README §7's "178 SECURITY DEFINER functions callable by
-- anon/authenticated" into a prioritized, reviewable list, because 178 is
-- too many to audit all at once with the same care. This ranks them so the
-- highest-blast-radius functions (money, auth, cross-tenant data) get
-- reviewed first.
-- ============================================================================

-- 1) Full inventory: every SECURITY DEFINER function callable by anon or
--    authenticated, with whether it pins search_path (a function WITHOUT
--    a pinned search_path is vulnerable to a classic search_path-hijack
--    privilege escalation — this column is the single highest-priority
--    thing to check first, before reading any function's actual logic).
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  r.rolname as owner,
  (
    select bool_or(cfg like 'search_path=%')
    from unnest(coalesce(p.proconfig, array[]::text[])) cfg
  ) as has_pinned_search_path,
  array_agg(distinct g.grantee::text) as granted_to
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_roles r on r.oid = p.proowner
join information_schema.role_routine_grants g
  on g.specific_schema = n.nspname
 and g.routine_name = p.proname
where n.nspname = 'public'
  and p.prosecdef = true -- SECURITY DEFINER only
  and g.grantee in ('anon', 'authenticated')
group by 1, 2, 3, p.proconfig
order by has_pinned_search_path asc nulls first, function_name; -- unpinned first = review first

-- 2) Priority tier 1 — money-moving or capacity-locking functions. Review
--    these before anything else: a bug here is a direct financial loss or
--    a double-booking, not just a data leak.
select proname as function_name, pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where pronamespace = 'public'::regnamespace
  and prosecdef = true
  and (
    proname ilike '%booking%' or proname ilike '%payment%' or
    proname ilike '%refund%' or proname ilike '%settlement%' or
    proname ilike '%payout%' or proname ilike '%price%'
  )
order by proname;

-- 3) Priority tier 2 — auth/session/role functions. A bug here can let one
--    role (e.g. an operator) act as another (e.g. admin).
select proname as function_name, pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where pronamespace = 'public'::regnamespace
  and prosecdef = true
  and (
    proname ilike '%admin%' or proname ilike '%session%' or
    proname ilike '%auth%' or proname ilike '%staff%' or proname ilike '%token%'
  )
order by proname;

-- 4) Everything else, lowest priority for a first pass (still needs review
--    eventually, just after tiers 1 and 2).
select proname as function_name, pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where pronamespace = 'public'::regnamespace
  and prosecdef = true
  and proname not ilike '%booking%' and proname not ilike '%payment%'
  and proname not ilike '%refund%' and proname not ilike '%settlement%'
  and proname not ilike '%payout%' and proname not ilike '%price%'
  and proname not ilike '%admin%' and proname not ilike '%session%'
  and proname not ilike '%auth%' and proname not ilike '%staff%' and proname not ilike '%token%'
order by proname;
