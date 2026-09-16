-- ============================================================================
-- READ-ONLY. Safe to run in Supabase SQL Editor. Does not modify anything.
-- Run this FIRST, before writing/changing any RLS policy.
--
-- Purpose: turn README §7's claim ("11 tables have RLS enabled with no
-- policy") into an exact, current, verifiable list — table by table, with
-- what's actually granted to anon/authenticated. Do not write a single
-- policy from memory/assumption; write it from this output.
--
-- Note on severity: RLS enabled + zero policies is Postgres's *secure*
-- default (deny-all to every non-owner role), not an open door. The real
-- risk here isn't "these tables are exposed" — it's the opposite: nobody
-- has confirmed *on purpose* that deny-all is correct for each of them, so
-- a future change (a new GRANT, a permissive policy added carelessly, or
-- someone "fixing" what looks like a bug) could open one without anyone
-- noticing. Ship #2 below (explicit deny policies) is about locking that
-- in writing, not about closing a hole that's open today.
-- ============================================================================

-- 1) Every table with RLS enabled and its policy count.
--    Look for is_rls_enabled = true AND policy_count = 0.
select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as is_rls_enabled,
  c.relforcerowsecurity as is_rls_forced,
  count(p.polname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where c.relkind = 'r'
  and n.nspname = 'public'
group by 1, 2, 3, 4
order by policy_count asc, table_name;

-- 2) For the tables above with policy_count = 0: what does anon/authenticated
--    actually have GRANTed at the table level? (RLS still wins over GRANT,
--    but this tells you what a *future* permissive policy would expose.)
select
  table_schema,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'booking_addon_services', 'booking_passengers', 'customer_subscriptions',
    'exchange_rates', 'external_links', 'ground_handling_partners',
    'ground_handling_services', 'ground_handling_staff',
    'ground_handling_statements', 'rental_partner_statements', 'tax_rules'
  )
group by 1, 2, 3
order by table_name, grantee;

-- 3) Sanity check across the WHOLE public schema (not just the known 11) —
--    catches any table that regressed to RLS-off-entirely, which is a real
--    open door, not just an undocumented deny-all.
select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as is_rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
  and c.relrowsecurity = false
order by table_name;
