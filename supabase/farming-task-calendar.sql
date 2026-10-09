-- =========================================================
-- tasks (farmer-only)
-- =========================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  title text not null check (btrim(title) <> ''),
  description text,
  category text check (
    category is null or category in (
      'Irrigation',
      'Pest Monitoring',
      'Fertilizer',
      'Equipment Maintenance',
      'Other'
    )
  ),
  due_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe additions if the table already exists
alter table public.tasks
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists completed_at timestamptz,
  add column if not exists farm_id uuid references public.farms (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

-- Category check (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_category_check'
  ) then
    alter table public.tasks
      add constraint tasks_category_check
      check (
        category is null or category in (
          'Irrigation',
          'Pest Monitoring',
          'Fertilizer',
          'Equipment Maintenance',
          'Other'
        )
      );
  end if;
end $$;

-- Indexes
create index if not exists tasks_farmer_due_idx
  on public.tasks (farmer_id, due_at);

create index if not exists tasks_farmer_open_idx
  on public.tasks (farmer_id, due_at)
  where completed_at is null;

-- One task with the same title per farmer per UTC day
create unique index if not exists tasks_unique_per_farmer_day_idx
  on public.tasks (
    farmer_id,
    lower(btrim(title)),
    ((due_at at time zone 'utc')::date)
  );

-- Auto-update updated_at
create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_tasks_updated_at()
  from public, anon, authenticated;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.set_tasks_updated_at();

-- =========================================================
-- Row Level Security — farmer-only
-- =========================================================
alter table public.tasks enable row level security;

drop policy if exists "Farmers read own tasks" on public.tasks;
create policy "Farmers read own tasks"
  on public.tasks
  for select
  to authenticated
  using (farmer_id = (select auth.uid()));

drop policy if exists "Farmers insert own tasks" on public.tasks;
create policy "Farmers insert own tasks"
  on public.tasks
  for insert
  to authenticated
  with check (
    farmer_id = (select auth.uid())
    and completed_at is null
    and (
      farm_id is null
      or exists (
        select 1 from public.farms
        where farms.id = tasks.farm_id
          and farms.farmer_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Farmers update own tasks" on public.tasks;
create policy "Farmers update own tasks"
  on public.tasks
  for update
  to authenticated
  using (farmer_id = (select auth.uid()))
  with check (farmer_id = (select auth.uid()));

drop policy if exists "Farmers delete own tasks" on public.tasks;
create policy "Farmers delete own tasks"
  on public.tasks
  for delete
  to authenticated
  using (farmer_id = (select auth.uid()));

-- =========================================================
-- Grants
-- =========================================================
grant select, insert, update, delete on public.tasks to authenticated;