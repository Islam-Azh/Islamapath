-- ============================================================
-- Teacher & Student English — Supabase setup
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================================

-- 1. Profiles: who is the student and who is the teacher.
create table if not exists public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  role  text not null check (role in ('student','teacher')),
  name  text not null default ''
);
alter table public.profiles enable row level security;

-- Role of the signed-in user (null for anyone without a profile).
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "members read profiles" on public.profiles;
create policy "members read profiles" on public.profiles
  for select to authenticated using (public.my_role() is not null);

-- 2. App state: one row per collection (homework, vocab, subs …).
--    scope = 'teacher' rows (private notes) are invisible to the student.
create table if not exists public.app_state (
  key         text primary key,
  value       jsonb not null,
  scope       text not null default 'shared' check (scope in ('shared','teacher')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) default auth.uid(),
  constraint notes_are_private check (key <> 'notes' or scope = 'teacher')
);
alter table public.app_state enable row level security;

drop policy if exists "read state"   on public.app_state;
drop policy if exists "insert state" on public.app_state;
drop policy if exists "update state" on public.app_state;

create policy "read state" on public.app_state for select to authenticated
  using (public.my_role() is not null and (scope = 'shared' or public.my_role() = 'teacher'));

create policy "insert state" on public.app_state for insert to authenticated
  with check (public.my_role() is not null and (scope = 'shared' or public.my_role() = 'teacher'));

create policy "update state" on public.app_state for update to authenticated
  using      (public.my_role() is not null and (scope = 'shared' or public.my_role() = 'teacher'))
  with check (public.my_role() is not null and (scope = 'shared' or public.my_role() = 'teacher'));

-- Live updates between the two browsers.
do $$ begin
  alter publication supabase_realtime add table public.app_state;
exception when duplicate_object then null; end $$;

-- 3. Private storage for voice recordings and voice feedback.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

drop policy if exists "members read audio"   on storage.objects;
drop policy if exists "members upload audio" on storage.objects;

create policy "members read audio" on storage.objects for select to authenticated
  using (bucket_id = 'audio' and public.my_role() is not null);

create policy "members upload audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and public.my_role() is not null);

-- 3b. Allow deleting old recordings (METHODIKA §10: audio is removed after 90 days, the diary is kept).
drop policy if exists "members delete audio" on storage.objects;
create policy "members delete audio" on storage.objects for delete to authenticated
  using (bucket_id = 'audio' and public.my_role() is not null);

-- ============================================================
-- 4. AFTER creating the two users (Authentication → Users → Add user),
--    replace the e-mails below and run this block.
-- ============================================================
-- insert into public.profiles (id, role, name)
-- select id, 'student', 'Islam' from auth.users where email = 'STUDENT_EMAIL@example.com'
-- on conflict (id) do update set role = excluded.role, name = excluded.name;
--
-- insert into public.profiles (id, role, name)
-- select id, 'teacher', 'Айнура' from auth.users where email = 'TEACHER_EMAIL@example.com'
-- on conflict (id) do update set role = excluded.role, name = excluded.name;
--
-- Check: select p.role, p.name, u.email from public.profiles p join auth.users u on u.id = p.id;
