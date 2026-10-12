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
  reviewed_at timestamptz
);

create index if not exists assistance_requests_farmer_created_idx
  on public.assistance_requests (farmer_id, created_at desc);

create index if not exists assistance_requests_status_created_idx
  on public.assistance_requests (status, created_at desc);

alter table public.assistance_requests enable row level security;

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

drop policy if exists "Farmers read own assistance requests"
  on public.assistance_requests;
create policy "Farmers read own assistance requests"
  on public.assistance_requests
  for select
  to authenticated
  using (farmer_id = (select auth.uid()));

drop policy if exists "Farmers create own assistance requests"
  on public.assistance_requests;
create policy "Farmers create own assistance requests"
  on public.assistance_requests
  for insert
  to authenticated
  with check (farmer_id = (select auth.uid()));

drop policy if exists "Admins read all assistance requests"
  on public.assistance_requests;
create policy "Admins read all assistance requests"
  on public.assistance_requests
  for select
  to authenticated
  using ((select public.is_assistance_admin()));

drop policy if exists "Admins update assistance requests"
  on public.assistance_requests;
create policy "Admins update assistance requests"
  on public.assistance_requests
  for update
  to authenticated
  using ((select public.is_assistance_admin()))
  with check ((select public.is_assistance_admin()));

grant select, insert on public.assistance_requests to authenticated;
grant update (status, admin_note, reviewed_at)
  on public.assistance_requests to authenticated;
