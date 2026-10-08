-- =========================================================
-- farm_expenses
-- =========================================================
create table if not exists public.farm_expenses (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  category text not null check (
    category in (
      'Seeds',
      'Fertilizer',
      'Pesticides',
      'Labor',
      'Fuel / Equipment',
      'Transportation',
      'Other'
    )
  ),
  amount numeric(12, 2) not null check (amount >= 0),
  note text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists farm_expenses_farmer_idx
  on public.farm_expenses (farmer_id, spent_at desc);

alter table public.farm_expenses enable row level security;

drop policy if exists "Farmers manage their own expenses" on public.farm_expenses;
create policy "Farmers manage their own expenses"
  on public.farm_expenses
  for all
  to authenticated
  using (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.farmers f
      where f.id = (select auth.uid()) and f.role = 'farmer'
    )
  )
  with check (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.farmers f
      where f.id = (select auth.uid()) and f.role = 'farmer'
    )
  );

grant select, insert, update, delete on public.farm_expenses to authenticated;