-- =========================================================
-- pest_reports
-- =========================================================
create table if not exists public.pest_reports (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  note text,
  image_path text not null,          -- path inside the 'pest-reports' bucket
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'resolved')),
  admin_note text,
  ai_diagnosis text,
  ai_confidence numeric(5,2),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists pest_reports_farmer_idx
  on public.pest_reports (farmer_id, created_at desc);

create index if not exists pest_reports_status_idx
  on public.pest_reports (status, created_at desc);

alter table public.pest_reports enable row level security;

-- Farmers: read/insert/delete their own reports
drop policy if exists "Farmers read own pest reports" on public.pest_reports;
create policy "Farmers read own pest reports"
  on public.pest_reports
  for select
  to authenticated
  using (farmer_id = (select auth.uid()));

drop policy if exists "Farmers insert own pest reports" on public.pest_reports;
create policy "Farmers insert own pest reports"
  on public.pest_reports
  for insert
  to authenticated
  with check (farmer_id = (select auth.uid()));

drop policy if exists "Farmers delete own pending pest reports" on public.pest_reports;
create policy "Farmers delete own pending pest reports"
  on public.pest_reports
  for delete
  to authenticated
  using (
    farmer_id = (select auth.uid())
    and status = 'pending'
  );

-- Admins: read everything + update status/notes
drop policy if exists "Admins read all pest reports" on public.pest_reports;
create policy "Admins read all pest reports"
  on public.pest_reports
  for select
  to authenticated
  using (
    exists (
      select 1 from public.farmers f
      where f.id = (select auth.uid()) and f.role = 'admin'
    )
  );

drop policy if exists "Admins update pest reports" on public.pest_reports;
create policy "Admins update pest reports"
  on public.pest_reports
  for update
  to authenticated
  using (
    exists (
      select 1 from public.farmers f
      where f.id = (select auth.uid()) and f.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.farmers f
      where f.id = (select auth.uid()) and f.role = 'admin'
    )
  );

grant select, insert, delete on public.pest_reports to authenticated;
grant update (status, admin_note, reviewed_at)
  on public.pest_reports to authenticated;

-- =========================================================
-- Storage bucket for the images
-- =========================================================
insert into storage.buckets (id, name, public)
values ('pest-reports', 'pest-reports', false)
on conflict (id) do nothing;

-- Farmers can upload into their own folder (path starts with their uid)
drop policy if exists "Farmers upload own pest images" on storage.objects;
create policy "Farmers upload own pest images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'pest-reports'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Farmers can read their own uploaded images
drop policy if exists "Farmers read own pest images" on storage.objects;
create policy "Farmers read own pest images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'pest-reports'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Admins can read every pest report image
drop policy if exists "Admins read all pest images" on storage.objects;
create policy "Admins read all pest images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'pest-reports'
    and exists (
      select 1 from public.farmers f
      where f.id = (select auth.uid()) and f.role = 'admin'
    )
  );

-- Farmers can delete their own images
drop policy if exists "Farmers delete own pest images" on storage.objects;
create policy "Farmers delete own pest images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'pest-reports'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );