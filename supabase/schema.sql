-- Optional: run once in the Supabase SQL editor to switch on sync across devices.
create table if not exists public.docs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.docs enable row level security;
create policy "own rows: read" on public.docs for select using (auth.uid() = user_id);
create policy "own rows: insert" on public.docs for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.docs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on public.docs for delete using (auth.uid() = user_id);
