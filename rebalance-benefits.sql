-- Run once after deploying the Chinese-first benefit fetcher.
-- It keeps user-submitted benefits untouched.

update public.benefit_catalog as benefits
set status = 'active', updated_at = now()
where benefits.status = 'cancelled'
  and benefits.is_automated = true
  and benefits.fetched_at >= now() - interval '1 day'
  and exists (
    select 1
    from public.benefit_sources as sources
    where sources.is_active = true
      and benefits.source_url like sources.base_url || '%'
  );

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
set status = 'cancelled', updated_at = now()
where status = 'active'
  and is_automated = true
  and lower(coalesce(source_url, '')) ~ '(udn\.com|cnyes\.com|chinatimes\.com|ettoday\.net|setn\.com|ltn\.com\.tw|moneydj\.com|businessweekly\.com\.tw|technews\.tw|inside\.com\.tw|yam\.com)';

select public.rebalance_benefit_catalog();
