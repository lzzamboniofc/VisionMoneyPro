-- VisionMoneyPro
-- Schema draft prepared for a future dedicated Supabase project.
-- IMPORTANT: this file is committed only. It has NOT been applied to any database.
--
-- Design goals:
-- 1) Multi-tenant by workspace_id
-- 2) Individual and shared workspaces
-- 3) Explicit Data API grants + RLS
-- 4) No service_role/secret keys in the browser
-- 5) Operational/admin data separated into private schema

begin;

create extension if not exists pgcrypto;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.workspace_kind as enum ('individual', 'shared');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workspace_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.category_kind as enum ('expense', 'income', 'both');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_status as enum ('pending', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payable_status as enum ('pending', 'paid', 'overdue', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.recurrence_frequency as enum ('weekly', 'monthly', 'yearly');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Core identity / tenancy
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  avatar_url text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  kind public.workspace_kind not null default 'individual',
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Financial catalog
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  kind public.category_kind not null default 'expense',
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name, kind),
  unique (workspace_id, id)
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  brand text,
  last_four char(4) check (last_four is null or last_four ~ '^[0-9]{4}$'),
  limit_amount numeric(14,2) check (limit_amount is null or limit_amount >= 0),
  closing_day smallint check (closing_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

-- ---------------------------------------------------------------------------
-- Financial entries
-- ---------------------------------------------------------------------------

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid,
  credit_card_id uuid,
  description text not null check (char_length(trim(description)) between 1 and 180),
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  status public.entry_status not null default 'completed',
  payment_method text,
  installments smallint not null default 1 check (installments between 1 and 120),
  installment_number smallint check (installment_number is null or installment_number between 1 and 120),
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (installment_number is null or installment_number <= installments),
  foreign key (workspace_id, category_id)
    references public.categories(workspace_id, id) on delete set null,
  foreign key (workspace_id, credit_card_id)
    references public.credit_cards(workspace_id, id) on delete set null
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid,
  description text not null check (char_length(trim(description)) between 1 and 180),
  amount numeric(14,2) not null check (amount > 0),
  income_date date not null default current_date,
  status public.entry_status not null default 'completed',
  source text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, category_id)
    references public.categories(workspace_id, id) on delete set null
);

create table if not exists public.payables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid,
  description text not null check (char_length(trim(description)) between 1 and 180),
  amount numeric(14,2) not null check (amount > 0),
  due_date date not null,
  status public.payable_status not null default 'pending',
  paid_at timestamptz,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, category_id)
    references public.categories(workspace_id, id) on delete set null
);

create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid not null,
  month date not null check (month = date_trunc('month', month)::date),
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, category_id, month),
  foreign key (workspace_id, category_id)
    references public.categories(workspace_id, id) on delete cascade
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  goal_id uuid not null,
  amount numeric(14,2) not null check (amount > 0),
  contributed_at date not null default current_date,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (workspace_id, goal_id)
    references public.goals(workspace_id, id) on delete cascade
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid,
  direction public.category_kind not null check (direction in ('expense', 'income')),
  description text not null check (char_length(trim(description)) between 1 and 180),
  amount numeric(14,2) not null check (amount > 0),
  frequency public.recurrence_frequency not null default 'monthly',
  next_date date not null,
  ends_on date,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= next_date),
  foreign key (workspace_id, category_id)
    references public.categories(workspace_id, id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Private operational tables (not exposed through the Data API)
-- ---------------------------------------------------------------------------

create table if not exists private.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists private.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  provider text,
  external_customer_id text,
  external_subscription_id text,
  plan_code text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'support' check (role in ('owner', 'admin', 'support')),
  created_at timestamptz not null default now()
);

create table if not exists private.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id, workspace_id);

create index if not exists categories_workspace_active_idx
  on public.categories (workspace_id, is_active, sort_order);

create index if not exists credit_cards_workspace_active_idx
  on public.credit_cards (workspace_id, is_active);

create index if not exists expenses_workspace_date_idx
  on public.expenses (workspace_id, expense_date desc);

create index if not exists expenses_workspace_category_date_idx
  on public.expenses (workspace_id, category_id, expense_date desc);

create index if not exists incomes_workspace_date_idx
  on public.incomes (workspace_id, income_date desc);

create index if not exists payables_workspace_due_status_idx
  on public.payables (workspace_id, due_date, status);

create index if not exists category_budgets_workspace_month_idx
  on public.category_budgets (workspace_id, month);

create index if not exists goals_workspace_active_idx
  on public.goals (workspace_id, is_completed, target_date);

create index if not exists goal_contributions_goal_date_idx
  on public.goal_contributions (goal_id, contributed_at desc);

create index if not exists recurring_workspace_next_idx
  on public.recurring_transactions (workspace_id, is_active, next_date);

create index if not exists workspace_invites_workspace_idx
  on private.workspace_invites (workspace_id, expires_at);

create index if not exists audit_events_workspace_created_idx
  on private.audit_events (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Utility functions
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = target_workspace
        and wm.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_workspace_role(
  target_workspace uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = target_workspace
        and wm.user_id = (select auth.uid())
        and wm.role = any (allowed_roles)
    );
$$;

create or replace function private.can_view_profile(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) = target_user
    or exists (
      select 1
      from public.workspace_members mine
      join public.workspace_members theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = target_user
    );
$$;

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.has_workspace_role(uuid, public.workspace_role[]) from public;
revoke all on function private.can_view_profile(uuid) from public;

grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

create or replace function private.prevent_last_workspace_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $
begin
  if old.role = 'owner'
     and (
       tg_op = 'DELETE'
       or (tg_op = 'UPDATE' and new.role <> 'owner')
     )
     and not exists (
       select 1
       from public.workspace_members wm
       where wm.workspace_id = old.workspace_id
         and wm.user_id <> old.user_id
         and wm.role = 'owner'
     )
  then
    raise exception 'workspace_requires_owner';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$;

revoke all on function private.prevent_last_workspace_owner() from public;

drop trigger if exists workspace_members_keep_owner on public.workspace_members;
create trigger workspace_members_keep_owner
before update of role or delete on public.workspace_members
for each row execute function private.prevent_last_workspace_owner();

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function private.set_updated_at();

drop trigger if exists credit_cards_set_updated_at on public.credit_cards;
create trigger credit_cards_set_updated_at
before update on public.credit_cards
for each row execute function private.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function private.set_updated_at();

drop trigger if exists incomes_set_updated_at on public.incomes;
create trigger incomes_set_updated_at
before update on public.incomes
for each row execute function private.set_updated_at();

drop trigger if exists payables_set_updated_at on public.payables;
create trigger payables_set_updated_at
before update on public.payables
for each row execute function private.set_updated_at();

drop trigger if exists category_budgets_set_updated_at on public.category_budgets;
create trigger category_budgets_set_updated_at
before update on public.category_budgets
for each row execute function private.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function private.set_updated_at();

drop trigger if exists recurring_set_updated_at on public.recurring_transactions;
create trigger recurring_set_updated_at
before update on public.recurring_transactions
for each row execute function private.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on private.subscriptions;
create trigger subscriptions_set_updated_at
before update on private.subscriptions
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Workspace bootstrap RPC
-- Runs as the caller (SECURITY INVOKER) and remains subject to RLS.
-- ---------------------------------------------------------------------------

create or replace function public.create_workspace(
  p_name text,
  p_kind public.workspace_kind default 'individual',
  p_currency char(3) default 'BRL'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_workspace uuid;
begin
  if v_user is null then
    raise exception 'authentication_required';
  end if;

  if char_length(trim(p_name)) < 2 then
    raise exception 'workspace_name_too_short';
  end if;

  insert into public.workspaces (name, kind, currency, created_by)
  values (trim(p_name), p_kind, upper(p_currency), v_user)
  returning id into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace, v_user, 'owner');

  insert into public.categories
    (workspace_id, name, kind, icon, sort_order, created_by)
  values
    (v_workspace, 'Moradia',       'expense', 'home',       10, v_user),
    (v_workspace, 'Alimentação',   'expense', 'utensils',   20, v_user),
    (v_workspace, 'Transporte',    'expense', 'car',        30, v_user),
    (v_workspace, 'Saúde',         'expense', 'heart',      40, v_user),
    (v_workspace, 'Educação',      'expense', 'book',       50, v_user),
    (v_workspace, 'Lazer',         'expense', 'sparkles',   60, v_user),
    (v_workspace, 'Assinaturas',   'expense', 'repeat',     70, v_user),
    (v_workspace, 'Compras',       'expense', 'shopping',   80, v_user),
    (v_workspace, 'Impostos',      'expense', 'receipt',    90, v_user),
    (v_workspace, 'Outros gastos', 'expense', 'circle',    100, v_user),
    (v_workspace, 'Salário',       'income',  'wallet',     10, v_user),
    (v_workspace, 'Freelance',     'income',  'briefcase',  20, v_user),
    (v_workspace, 'Rendimentos',   'income',  'trending-up',30, v_user),
    (v_workspace, 'Outras rendas', 'income',  'plus',       40, v_user);

  return v_workspace;
end;
$$;

revoke all on function public.create_workspace(text, public.workspace_kind, char) from public;
revoke all on function public.create_workspace(text, public.workspace_kind, char) from anon;
grant execute on function public.create_workspace(text, public.workspace_kind, char) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.payables enable row level security;
alter table public.category_budgets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.recurring_transactions enable row level security;

alter table private.workspace_invites enable row level security;
alter table private.subscriptions enable row level security;
alter table private.admin_users enable row level security;
alter table private.audit_events enable row level security;

-- Profiles

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles for select
to authenticated
using (private.can_view_profile(id));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Workspaces

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select
on public.workspaces for select
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_workspace_member(id)
);

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert
on public.workspaces for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update
on public.workspaces for update
to authenticated
using (private.has_workspace_role(id, array['owner','admin']::public.workspace_role[]))
with check (private.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));

drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete
on public.workspaces for delete
to authenticated
using (private.has_workspace_role(id, array['owner']::public.workspace_role[]));

-- Workspace members

drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select
on public.workspace_members for select
to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists workspace_members_insert_initial_owner on public.workspace_members;
create policy workspace_members_insert_initial_owner
on public.workspace_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.workspaces w
    where w.id = workspace_id
      and w.created_by = (select auth.uid())
  )
);

drop policy if exists workspace_members_insert_by_manager on public.workspace_members;
create policy workspace_members_insert_by_manager
on public.workspace_members for insert
to authenticated
with check (
  (
    private.has_workspace_role(workspace_id, array['owner']::public.workspace_role[])
  )
  or (
    role = 'member'
    and private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
  )
);

drop policy if exists workspace_members_update_owner on public.workspace_members;
create policy workspace_members_update_owner
on public.workspace_members for update
to authenticated
using (private.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]))
with check (private.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

drop policy if exists workspace_members_delete_owner on public.workspace_members;
create policy workspace_members_delete_owner
on public.workspace_members for delete
to authenticated
using (private.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

-- Common workspace data policies

drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists categories_insert on public.categories;
create policy categories_insert on public.categories for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists categories_update on public.categories;
create policy categories_update on public.categories for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists categories_delete on public.categories;
create policy categories_delete on public.categories for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists credit_cards_select on public.credit_cards;
create policy credit_cards_select on public.credit_cards for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists credit_cards_insert on public.credit_cards;
create policy credit_cards_insert on public.credit_cards for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists credit_cards_update on public.credit_cards;
create policy credit_cards_update on public.credit_cards for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists credit_cards_delete on public.credit_cards;
create policy credit_cards_delete on public.credit_cards for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists incomes_select on public.incomes;
create policy incomes_select on public.incomes for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists incomes_insert on public.incomes;
create policy incomes_insert on public.incomes for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists incomes_update on public.incomes;
create policy incomes_update on public.incomes for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists incomes_delete on public.incomes;
create policy incomes_delete on public.incomes for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists payables_select on public.payables;
create policy payables_select on public.payables for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists payables_insert on public.payables;
create policy payables_insert on public.payables for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists payables_update on public.payables;
create policy payables_update on public.payables for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists payables_delete on public.payables;
create policy payables_delete on public.payables for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists category_budgets_select on public.category_budgets;
create policy category_budgets_select on public.category_budgets for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists category_budgets_insert on public.category_budgets;
create policy category_budgets_insert on public.category_budgets for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists category_budgets_update on public.category_budgets;
create policy category_budgets_update on public.category_budgets for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists category_budgets_delete on public.category_budgets;
create policy category_budgets_delete on public.category_budgets for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists goals_insert on public.goals;
create policy goals_insert on public.goals for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists goals_update on public.goals;
create policy goals_update on public.goals for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists goals_delete on public.goals;
create policy goals_delete on public.goals for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists goal_contributions_select on public.goal_contributions;
create policy goal_contributions_select on public.goal_contributions for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists goal_contributions_insert on public.goal_contributions;
create policy goal_contributions_insert on public.goal_contributions for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists goal_contributions_update on public.goal_contributions;
create policy goal_contributions_update on public.goal_contributions for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists goal_contributions_delete on public.goal_contributions;
create policy goal_contributions_delete on public.goal_contributions for delete to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists recurring_transactions_select on public.recurring_transactions;
create policy recurring_transactions_select on public.recurring_transactions for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists recurring_transactions_insert on public.recurring_transactions;
create policy recurring_transactions_insert on public.recurring_transactions for insert to authenticated
with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
drop policy if exists recurring_transactions_update on public.recurring_transactions;
create policy recurring_transactions_update on public.recurring_transactions for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
drop policy if exists recurring_transactions_delete on public.recurring_transactions;
create policy recurring_transactions_delete on public.recurring_transactions for delete to authenticated
using (private.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- Explicit Data API grants
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;

grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.credit_cards to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.incomes to authenticated;
grant select, insert, update, delete on public.payables to authenticated;
grant select, insert, update, delete on public.category_budgets to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.goal_contributions to authenticated;
grant select, insert, update, delete on public.recurring_transactions to authenticated;

-- Private tables are server-side only.
revoke all on schema private from anon, authenticated, public;
revoke all on all tables in schema private from anon, authenticated, public;
revoke all on all sequences in schema private from anon, authenticated, public;

-- Re-allow authenticated callers to use only the internal membership helpers.
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

-- create_workspace is the only public application RPC at this stage.
grant execute on function public.create_workspace(text, public.workspace_kind, char) to authenticated;

commit;
