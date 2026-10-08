-- =========================================================
-- Extend farms with the columns the UI expects
-- =========================================================
alter table public.farms
  add column if not exists crop text,
  add column if not exists variety text,
  add column if not exists status text,
  add column if not exists planted_date date,
  add column if not exists expected_harvest date,
  add column if not exists image_url text;

-- Backfill status for any rows that don't have one yet,
-- THEN apply the NOT NULL + default. Order matters.
update public.farms
   set status = 'Growing'
 where status is null;

alter table public.farms
  alter column status set default 'Growing',
  alter column status set not null;

-- =========================================================
-- Constrain status to known values
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'farms_status_check'
  ) then
    alter table public.farms
      add constraint farms_status_check
      check (status in ('Growing', 'Harvested', 'Fallow'));
  end if;
end $$;

-- =========================================================
-- Prevent accidental duplicate farm rows
-- =========================================================
-- 1) Clean any existing duplicates (keep newest)
with ranked as (
  select id,
         row_number() over (
           partition by farmer_id, lower(name)
           order by created_at desc
         ) as rn
  from public.farms
)
delete from public.farms
where id in (select id from ranked where rn > 1);

-- 2) Now enforce uniqueness per farmer per farm name
create unique index if not exists farms_unique_per_farmer_name_idx
  on public.farms (farmer_id, lower(name));