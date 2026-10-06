-- VisionMoneyPro database verification checklist
-- Read-only checks to run AFTER schema.sql is applied to a dedicated project.
-- This file has not been executed.

-- 1) Every application table in public should have RLS enabled.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname in ('public', 'private')
  and tablename in (
    'profiles','workspaces','workspace_members','categories','credit_cards',
    'expenses','incomes','payables','category_budgets','goals',
    'goal_contributions','recurring_transactions',
    'workspace_invites','subscriptions','admin_users','audit_events'
  )
order by schemaname, tablename;

-- 2) Review all policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'private')
order by schemaname, tablename, policyname;

-- 3) anon should have no table privileges on application tables.
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema in ('public', 'private')
order by table_schema, table_name, privilege_type;

-- 4) authenticated grants should be explicit and limited to public app tables.
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema in ('public', 'private')
order by table_schema, table_name, privilege_type;

-- 5) Confirm key indexes exist.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname in ('public', 'private')
order by schemaname, tablename, indexname;

-- 6) Confirm private operational tables are not directly granted to authenticated.
select count(*) as private_authenticated_grants
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema = 'private';

-- Expected: 0
