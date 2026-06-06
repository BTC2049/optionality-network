-- Optionality Network secure signup lead capture.
-- Run this entire file once in Supabase SQL Editor.

create table if not exists public.signup_leads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  provider text,
  signed_up_at timestamptz not null default now(),
  last_sign_in_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.signup_leads enable row level security;

revoke all on public.signup_leads from anon;
revoke all on public.signup_leads from authenticated;
grant select on public.signup_leads to authenticated;

drop policy if exists "admins can read signup leads" on public.signup_leads;
create policy "admins can read signup leads"
on public.signup_leads for select
using (public.is_admin());

create or replace function public.sync_signup_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null then
    insert into public.signup_leads (
      user_id,
      email,
      provider,
      signed_up_at,
      last_sign_in_at,
      updated_at
    )
    values (
      new.id,
      lower(new.email),
      coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
      coalesce(new.created_at, now()),
      new.last_sign_in_at,
      now()
    )
    on conflict (user_id) do update set
      email = excluded.email,
      provider = excluded.provider,
      last_sign_in_at = excluded.last_sign_in_at,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists sync_signup_lead_on_auth_user on auth.users;
create trigger sync_signup_lead_on_auth_user
after insert or update of email, last_sign_in_at on auth.users
for each row execute function public.sync_signup_lead();

insert into public.signup_leads (
  user_id,
  email,
  provider,
  signed_up_at,
  last_sign_in_at,
  updated_at
)
select
  id,
  lower(email),
  coalesce(raw_app_meta_data ->> 'provider', 'email'),
  coalesce(created_at, now()),
  last_sign_in_at,
  now()
from auth.users
where email is not null
on conflict (user_id) do update set
  email = excluded.email,
  provider = excluded.provider,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

-- Public member cards must never expose Email.
revoke select on public.profiles from anon, authenticated;
grant select (
  id,
  username,
  full_name,
  title,
  country,
  languages,
  bio,
  telegram,
  twitter,
  website,
  resources_have,
  resources_need,
  profile_views,
  connections,
  completed_partnerships,
  member_since,
  created_at,
  updated_at
) on public.profiles to anon, authenticated;
