-- Run this once in the Supabase SQL editor.
-- It creates the table that holds each player's progress and locks it down so
-- one account can never read or write another account's row.

create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  resume     jsonb,
  seq        bigint      not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

drop policy if exists "read own save"   on public.saves;
drop policy if exists "insert own save" on public.saves;
drop policy if exists "update own save" on public.saves;

create policy "read own save"   on public.saves for select using (auth.uid() = user_id);
create policy "insert own save" on public.saves for insert with check (auth.uid() = user_id);
create policy "update own save" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Handy for checking on the group without exposing anyone's email.
create or replace view public.progress as
  select
    left(user_id::text, 8)                              as player,
    (data -> 'easy'   ->> 'unlocked')::int              as easy_level,
    (data -> 'medium' ->> 'unlocked')::int              as medium_level,
    (data -> 'hard'   ->> 'unlocked')::int              as hard_level,
    updated_at
  from public.saves;
