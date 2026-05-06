-- Replace the current_setting approach (requires ALTER DATABASE = superuser)
-- with a simple config table readable by the cron wrapper function.

CREATE TABLE IF NOT EXISTS app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Only the service role and postgres can read/write this table
REVOKE ALL ON app_config FROM anon, authenticated;

-- Recreate the wrapper to read from the config table
CREATE OR REPLACE FUNCTION trigger_exchange_rate_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  SELECT value INTO v_url    FROM app_config WHERE key = 'supabase_project_url';
  SELECT value INTO v_secret FROM app_config WHERE key = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'trigger_exchange_rate_update: app_config missing supabase_project_url or cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/update-exchange-rates',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', v_secret
    ),
    body    := '{}'::jsonb
  );
END;
$$;
