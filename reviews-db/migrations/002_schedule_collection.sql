-- Runs collect-reviews every 15 minutes for apps requested in the last 7 days.
-- Already applied to project ohwveqcepywunrmgrzvr. Placeholders must be replaced before re-running:
--   <ANON_KEY>    : the project's legacy anon key
--   <CRON_SECRET> : same value as the CRON_SECRET edge function secret
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('collect-reviews-15m')
where exists (select 1 from cron.job where jobname = 'collect-reviews-15m');

select cron.schedule('collect-reviews-15m', '*/15 * * * *', $job$
  select net.http_post(
    url := 'https://ohwveqcepywunrmgrzvr.supabase.co/functions/v1/collect-reviews',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{"mode":"all"}'::jsonb,
    timeout_milliseconds := 150000
  );
$job$);
