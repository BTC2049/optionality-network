-- Pause automated benefit collection and hide all previously fetched records.
-- User-created benefits and opportunities are not affected.

update public.benefit_catalog
set status = 'cancelled', updated_at = now()
where is_automated = true
  and status <> 'cancelled';

update public.benefit_sources
set is_active = false, updated_at = now()
where is_active = true;

select cron.unschedule('optionality-daily-benefit-fetcher')
where exists (
  select 1 from cron.job where jobname = 'optionality-daily-benefit-fetcher'
);

select cron.unschedule('optionality-expire-benefits')
where exists (
  select 1 from cron.job where jobname = 'optionality-expire-benefits'
);
