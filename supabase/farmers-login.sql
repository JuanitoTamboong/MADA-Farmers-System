-- =========================================================
-- 1. farmers table
-- =========================================================
create table if not exists public.farmers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (btrim(full_name) <> ''),
  email text not null,
  address text not null check (btrim(address) <> ''),
  role text not null default 'farmer' check (role in ('farmer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the table already exists, add the role column safely
alter table public.farmers
  add column if not exists role text not null default 'farmer';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'farmers_role_check'
  ) then
    alter table public.farmers
      add constraint farmers_role_check check (role in ('farmer', 'admin'));
  end if;
end $$;

-- Case-insensitive unique email
create unique index if not exists farmers_email_lower_idx
  on public.farmers (lower(email));

-- =========================================================
-- 2. Row Level Security
-- =========================================================
alter table public.farmers enable row level security;

-- Farmers can view only their own row AND only if they are a farmer
drop policy if exists "Farmers can view their own profile" on public.farmers;
create policy "Farmers can view their own profile"
  on public.farmers
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    and role = 'farmer'
    and coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'farmer',
      true
    )
  );

-- Farmers can update only their own row (and cannot change role/email/id)
drop policy if exists "Farmers can update their own profile" on public.farmers;
create policy "Farmers can update their own profile"
  on public.farmers
  for update
  to authenticated
  using (
    (select auth.uid()) = id
    and role = 'farmer'
  )
  with check (
    (select auth.uid()) = id
    and role = 'farmer'
  );

grant select on public.farmers to authenticated;
grant update (full_name, address) on public.farmers to authenticated;

-- =========================================================
-- 3. Auto-update updated_at
-- =========================================================
create or replace function public.set_farmers_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_farmers_updated_at()
  from public, anon, authenticated;

drop trigger if exists farmers_set_updated_at on public.farmers;
create trigger farmers_set_updated_at
  before update on public.farmers
  for each row
  execute function public.set_farmers_updated_at();

-- =========================================================
-- 4. Create farmer row on new auth user (farmer signups only)
-- =========================================================
create or replace function public.create_farmer_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  farmer_name text;
  farmer_address text;
begin
  farmer_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  farmer_address := nullif(btrim(new.raw_user_meta_data ->> 'address'), '');

  -- If it's not a farmer signup (e.g. admin created via dashboard),
  -- skip silently instead of raising an exception.
  if new.email is null or farmer_name is null or farmer_address is null then
    return new;
  end if;

  insert into public.farmers (id, full_name, email, address, role)
  values (new.id, farmer_name, lower(new.email), farmer_address, 'farmer')
  on conflict (id) do nothing;

  -- Stamp app_metadata.role = 'farmer' so the JWT carries the claim.
  update auth.users
     set raw_app_meta_data =
           coalesce(raw_app_meta_data, '{}'::jsonb)
           || jsonb_build_object('role', 'farmer')
   where id = new.id;

  return new;
end;
$$;

revoke all on function public.create_farmer_for_new_auth_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created_farmer on auth.users;
create trigger on_auth_user_created_farmer
  after insert on auth.users
  for each row
  execute function public.create_farmer_for_new_auth_user();

-- =========================================================
-- 5. Keep farmers.email in sync when auth email changes
-- =========================================================
create or replace function public.sync_farmer_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.farmers
       set email = lower(new.email)
     where id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_farmer_email_from_auth()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_email_updated_farmer on auth.users;
create trigger on_auth_user_email_updated_farmer
  after update of email on auth.users
  for each row
  execute function public.sync_farmer_email_from_auth();