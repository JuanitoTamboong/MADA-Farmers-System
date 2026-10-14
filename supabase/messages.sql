-- ============================================================
-- 1. MESSAGES TABLE
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.farmers(id) on delete cascade,
  receiver_id uuid not null references public.farmers(id) on delete cascade,
  content text not null check (btrim(content) <> ''),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Index for fast conversation lookup (farmer ↔ admin)
create index if not exists messages_conversation_idx
  on public.messages (sender_id, receiver_id, created_at);

-- Index for unread message counts
create index if not exists messages_unread_idx
  on public.messages (receiver_id, read_at)
  where read_at is null;


-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.messages enable row level security;

-- Drop old policies if re-running this script
drop policy if exists "Users can read their own messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Recipients can mark messages as read" on public.messages;
drop policy if exists "Users can delete their own sent messages" on public.messages;
drop policy if exists "Admins read all messages" on public.messages;

-- Farmer/Admin can READ messages where they are sender or receiver
create policy "Users can read their own messages"
  on public.messages
  for select
  to authenticated
  using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
    or public.is_admin()
  );

-- Farmer/Admin can SEND messages as themselves
create policy "Users can send messages"
  on public.messages
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Only the RECEIVER can mark as read
create policy "Recipients can mark messages as read"
  on public.messages
  for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Sender can delete their own messages
create policy "Users can delete their own sent messages"
  on public.messages
  for delete
  to authenticated
  using (auth.uid() = sender_id);

-- Admin override — read everything (for an admin inbox UI)
create policy "Admins read all messages"
  on public.messages
  for select
  to authenticated
  using (public.is_admin());


-- ============================================================
-- 3. ENABLE REAL-TIME BROADCAST
-- ============================================================
alter publication supabase_realtime add table public.messages;

alter table public.messages replica identity full;


-- ============================================================
-- 4. VERIFY
-- ============================================================
select
  'messages table created' as status,
  count(*) as rows
from public.messages;

select polname, polcmd
from pg_policy
where polrelid = 'public.messages'::regclass
order by polname;