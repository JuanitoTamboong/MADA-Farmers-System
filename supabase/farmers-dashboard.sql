-- farms
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  area_hectares numeric(10, 2) not null check (area_hectares > 0),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farms_farmer_id_idx on public.farms (farmer_id);

alter table public.farms enable row level security;
drop policy if exists "Farmers manage their own farms" on public.farms;
create policy "Farmers manage their own farms"
  on public.farms for all to authenticated
  using (
    farmer_id = (select auth.uid())
    and exists (select 1 from public.farmers f
                where f.id = (select auth.uid()) and f.role = 'farmer')
  )
  with check (
    farmer_id = (select auth.uid())
    and exists (select 1 from public.farmers f
                where f.id = (select auth.uid()) and f.role = 'farmer')
  );
grant select, insert, update, delete on public.farms to authenticated;

-- tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  title text not null check (btrim(title) <> ''),
  description text,
  due_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_farmer_due_idx
  on public.tasks (farmer_id, due_at) where completed_at is null;

alter table public.tasks enable row level security;
drop policy if exists "Farmers manage their own tasks" on public.tasks;
create policy "Farmers manage their own tasks"
  on public.tasks for all to authenticated
  using (
    farmer_id = (select auth.uid())
    and exists (select 1 from public.farmers f
                where f.id = (select auth.uid()) and f.role = 'farmer')
  )
  with check (
    farmer_id = (select auth.uid())
    and exists (select 1 from public.farmers f
                where f.id = (select auth.uid()) and f.role = 'farmer')
  );
grant select, insert, update, delete on public.tasks to authenticated;