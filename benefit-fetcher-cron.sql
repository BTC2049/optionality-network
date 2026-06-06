-- Pause all automated benefit jobs.

create extension if not exists pg_cron;

select cron.unschedule('optionality-daily-benefit-fetcher')
where exists (
  select 1 from cron.job where jobname = 'optionality-daily-benefit-fetcher'
);

select cron.unschedule('optionality-expire-benefits')
where exists (
  select 1 from cron.job where jobname = 'optionality-expire-benefits'
);
