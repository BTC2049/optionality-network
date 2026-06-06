-- Schedule benefit-fetcher every day at 01:10 UTC (09:10 Taiwan time).
-- Replace YOUR_PROJECT_REF and YOUR_BENEFIT_FETCH_SECRET before running.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('optionality-daily-benefit-fetcher')
where exists (
  select 1 from cron.job where jobname = 'optionality-daily-benefit-fetcher'
);

select cron.schedule(
  'optionality-daily-benefit-fetcher',
  '10 1 * * *',
  $$
  select net.http_post(
    url := 'https://wtyoyzuzakuodpfbptaf.supabase.co/functions/v1/benefit-fetcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-benefit-secret', 'YOUR_BENEFIT_FETCH_SECRET'
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- Move ended activities out of active listings shortly after midnight in Taiwan.
select cron.unschedule('optionality-expire-benefits')
where exists (
  select 1 from cron.job where jobname = 'optionality-expire-benefits'
);

select cron.schedule(
  'optionality-expire-benefits',
  '5 16 * * *',
  $$select public.expire_old_benefits();$$
);
