-- ============================================================
-- Assistance requests
-- ============================================================

create table if not exists public.assistance_requests (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  category text not null check (
    category in (
      'Seeds',
      'Fertilizer',
      'Technical Assistance',
      'Pest Inspection',
      'Financial Subsidy'
    )
  ),
  notes text,
  status text not null default 'Pending' check (
    status in ('Pending', 'Approved', 'In Progress', 'Completed', 'Rejected')
  ),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),   -- ← added
  reviewed_at timestamptz
);

-- If the table already existed WITHOUT updated_at, add it now
alter table public.assistance_requests
  add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists assistance_requests_farmer_created_idx
  on public.assistance_requests (farmer_id, created_at desc);

create index if not exists assistance_requests_status_created_idx
  on public.assistance_requests (status, created_at desc);

-- ============================================================
-- Auto-update updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists assistance_requests_set_updated_at
  on public.assistance_requests;

create trigger assistance_requests_set_updated_at
before update on public.assistance_requests
for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.assistance_requests enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_assistance_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farmers
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_assistance_admin()
  from public, anon, authenticated;
grant execute on function public.is_assistance_admin() to authenticated;

-- ---------- Farmer policies ----------

-- Read own requests
drop policy if exists "Farmers read own assistance requests"
  on public.assistance_requests;
create policy "Farmers read own assistance requests"
  on public.assistance_requests
  for select
  to authenticated
  using (farmer_id = (select auth.uid()));

-- Create own requests
drop policy if exists "Farmers create own assistance requests"
  on public.assistance_requests;
create policy "Farmers create own assistance requests"
  on public.assistance_requests
  for insert
  to authenticated
  with check (farmer_id = (select auth.uid()));

-- NEW — Edit own PENDING requests (cannot change status)
drop policy if exists "Farmers update own pending assistance requests"
  on public.assistance_requests;
create policy "Farmers update own pending assistance requests"
  on public.assistance_requests
  for update
  to authenticated
  using (
    farmer_id = (select auth.uid())
    and status = 'Pending'
  )
  with check (
    farmer_id = (select auth.uid())
    and status = 'Pending'
  );

-- NEW — Delete own PENDING requests
drop policy if exists "Farmers delete own pending assistance requests"
  on public.assistance_requests;
create policy "Farmers delete own pending assistance requests"
  on public.assistance_requests
  for delete
  to authenticated
  using (
    farmer_id = (select auth.uid())
    and status = 'Pending'
  );

-- ---------- Admin policies ----------

-- Read all requests
drop policy if exists "Admins read all assistance requests"
  on public.assistance_requests;
create policy "Admins read all assistance requests"
  on public.assistance_requests
  for select
  to authenticated
  using ((select public.is_assistance_admin()));

-- Update any request (change status, admin note, reviewed_at)
drop policy if exists "Admins update assistance requests"
  on public.assistance_requests;
create policy "Admins update assistance requests"
  on public.assistance_requests
  for update
  to authenticated
  using ((select public.is_assistance_admin()))
  with check ((select public.is_assistance_admin()));

-- ============================================================
-- Grants
-- ============================================================

grant select, insert, update, delete
  on public.assistance_requests to authenticated;