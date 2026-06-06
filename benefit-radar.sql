-- Optionality Network automated benefit catalog.
-- Run this entire file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.benefit_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  base_url text not null,
  source_group text not null check (source_group in ('exchange', 'quest', 'airdrop')),
  locale text not null default 'zh-TW',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.benefit_sources enable row level security;
drop policy if exists "admins manage benefit sources" on public.benefit_sources;
create policy "admins manage benefit sources"
on public.benefit_sources for all
using (public.is_admin())
with check (public.is_admin());

insert into public.benefit_sources (name, url, base_url, source_group, locale)
values
  ('Binance', 'https://www.binance.com/zh-TC/support/announcement/list/93', 'https://www.binance.com', 'exchange', 'zh-TW'),
  ('Bybit', 'https://www.bybit.com/zh-TW/promo/global', 'https://www.bybit.com', 'exchange', 'zh-TW'),
  ('OKX', 'https://www.okx.com/zh-hant/help/section/announcements-latest-announcements', 'https://www.okx.com', 'exchange', 'zh-TW'),
  ('Bitget', 'https://www.bitget.com/zh-TW/support', 'https://www.bitget.com', 'exchange', 'zh-TW'),
  ('Gate', 'https://www.gate.com/zh-tw/announcements', 'https://www.gate.com', 'exchange', 'zh-TW'),
  ('MEXC', 'https://www.mexc.com/zh-TW/support', 'https://www.mexc.com', 'exchange', 'zh-TW'),
  ('BingX', 'https://bingx.com/zh-tw/support/notice/', 'https://bingx.com', 'exchange', 'zh-TW'),
  ('Galxe', 'https://app.galxe.com/quest', 'https://app.galxe.com', 'quest', 'en'),
  ('Layer3', 'https://layer3.xyz/quests', 'https://layer3.xyz', 'quest', 'en'),
  ('Zealy', 'https://zealy.io/explore', 'https://zealy.io', 'quest', 'en'),
  ('Intract', 'https://www.intract.io/quest', 'https://www.intract.io', 'quest', 'en'),
  ('TaskOn', 'https://taskon.xyz/campaign', 'https://taskon.xyz', 'quest', 'en'),
  ('CoinMarketCap', 'https://coinmarketcap.com/airdrop/', 'https://coinmarketcap.com', 'airdrop', 'en'),
  ('DappRadar', 'https://dappradar.com/hub/airdrops', 'https://dappradar.com', 'airdrop', 'en'),
  ('Airdrops.io', 'https://airdrops.io/latest/', 'https://airdrops.io', 'airdrop', 'en')
on conflict (url) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  source_group = excluded.source_group,
  locale = excluded.locale,
  updated_at = now();

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
  update public.benefit_catalog as benefits
  set status = 'cancelled', updated_at = now()
  where benefits.status = 'active'
    and benefits.is_automated = true
    and not exists (
      select 1
      from public.benefit_sources as sources
      where sources.is_active = true
        and benefits.source_url like sources.base_url || '%'
    );

  update public.benefit_catalog
  set status = 'expired', updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.rebalance_benefit_catalog()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.benefit_catalog
  set status = 'cancelled', updated_at = now()
  where status = 'active'
    and is_automated = true
    and lower(coalesce(source_url, '')) ~ '(udn\.com|cnyes\.com|chinatimes\.com|ettoday\.net|setn\.com|ltn\.com\.tw|moneydj\.com|businessweekly\.com\.tw|technews\.tw|inside\.com\.tw|yam\.com)';

  get diagnostics affected = row_count;
  return affected;
end;
$$;
