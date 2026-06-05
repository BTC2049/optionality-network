create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique not null,
  full_name text not null,
  title text not null,
  country text not null,
  languages text[] default array[]::text[],
  bio text,
  telegram text,
  twitter text,
  website text,
  resources_have text[] default array[]::text[],
  resources_need text[] default array[]::text[],
  profile_views integer default 0,
  connections integer default 0,
  completed_partnerships integer default 0,
  member_since timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  country text,
  budget text,
  contact_method text,
  status text default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz default now()
);

create table if not exists public.partnership_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'later', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.partnership_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.partnership_requests(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.admins (
  email text primary key
);

alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.partnership_requests enable row level security;
alter table public.partnership_messages enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where email = auth.jwt() ->> 'email'
  );
$$;

alter table public.opportunities
add column if not exists status text default 'active';

alter table public.opportunities
drop constraint if exists opportunities_status_check;

alter table public.opportunities
add constraint opportunities_status_check
check (status in ('active', 'cancelled'));

drop policy if exists "approved profiles are public" on public.profiles;
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public"
on public.profiles for select
using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "users can update own profile or admins approve" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "opportunities are public" on public.opportunities;
create policy "opportunities are public"
on public.opportunities for select
using (true);

drop policy if exists "authenticated users can create opportunities" on public.opportunities;
create policy "authenticated users can create opportunities"
on public.opportunities for insert
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
  )
);

drop policy if exists "owners can update own opportunities" on public.opportunities;
create policy "owners can update own opportunities"
on public.opportunities for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "request participants can read" on public.partnership_requests;
create policy "request participants can read"
on public.partnership_requests for select
using (auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin());

drop policy if exists "authenticated users can create requests" on public.partnership_requests;
create policy "authenticated users can create requests"
on public.partnership_requests for insert
with check (auth.uid() = sender_id);

drop policy if exists "receiver can update requests" on public.partnership_requests;
create policy "receiver can update requests"
on public.partnership_requests for update
using (auth.uid() = receiver_id or public.is_admin())
with check (auth.uid() = receiver_id or public.is_admin());

drop policy if exists "request participants can read messages" on public.partnership_messages;
create policy "request participants can read messages"
on public.partnership_messages for select
using (
  exists (
    select 1
    from public.partnership_requests
    where partnership_requests.id = partnership_messages.request_id
      and (auth.uid() = partnership_requests.sender_id or auth.uid() = partnership_requests.receiver_id)
  )
  or public.is_admin()
);

drop policy if exists "request participants can send messages" on public.partnership_messages;
create policy "request participants can send messages"
on public.partnership_messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.partnership_requests
    where partnership_requests.id = partnership_messages.request_id
      and (auth.uid() = partnership_requests.sender_id or auth.uid() = partnership_requests.receiver_id)
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'partnership_requests'
  ) then
    alter publication supabase_realtime add table public.partnership_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'partnership_messages'
  ) then
    alter publication supabase_realtime add table public.partnership_messages;
  end if;
end $$;

drop policy if exists "admins can read admins" on public.admins;
create policy "admins can read admins"
on public.admins for select
using (public.is_admin());

insert into public.admins (email)
values ('willia098888@gmail.com')
on conflict (email) do nothing;
