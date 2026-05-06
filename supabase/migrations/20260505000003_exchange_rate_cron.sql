-- Enable pg_net for outbound HTTP from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Wrapper called by pg_cron every hour.
-- Requires two database parameters set once after deployment:
--   ALTER DATABASE postgres SET app.supabase_project_url = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres SET app.cron_secret = '<your-cron-secret>';
CREATE OR REPLACE FUNCTION trigger_exchange_rate_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := current_setting('app.supabase_project_url') || '/functions/v1/update-exchange-rates',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret')
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- Schedule hourly at :05 past the hour
SELECT cron.unschedule('update-exchange-rates-hourly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-exchange-rates-hourly'
);

SELECT cron.schedule(
  'update-exchange-rates-hourly',
  '5 * * * *',
  $$SELECT trigger_exchange_rate_update()$$
);
