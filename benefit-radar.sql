-- Optionality Network automated benefit catalog.
-- Run this entire file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.benefit_catalog (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null unique,
  title text not null,
  summary text not null,
  category text not null default '活動福利',
  audience text not null default '加密用戶',
  value_text text not null default '查看官方活動條件',
  image_url text,
  published_at timestamptz,
  expires_at timestamptz,
  fetched_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  is_automated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists benefit_catalog_active_date_idx
on public.benefit_catalog (status, published_at desc, created_at desc);

alter table public.benefit_catalog enable row level security;

drop policy if exists "active benefits are public" on public.benefit_catalog;
drop policy if exists "published benefits are public" on public.benefit_catalog;
create policy "published benefits are public"
on public.benefit_catalog for select
using (
  status in ('active', 'expired')
);

drop policy if exists "admins manage benefit catalog" on public.benefit_catalog;
create policy "admins manage benefit catalog"
on public.benefit_catalog for all
using (public.is_admin())
with check (public.is_admin());

grant select on public.benefit_catalog to anon, authenticated;
grant insert, update, delete on public.benefit_catalog to authenticated;

create or replace function public.expire_old_benefits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.benefit_catalog
  set status = 'expired', updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;
