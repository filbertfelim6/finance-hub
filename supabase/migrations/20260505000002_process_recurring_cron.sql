-- Enable pg_cron extension (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if present (idempotent re-runs)
SELECT cron.unschedule('process-recurring-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-recurring-daily'
);

-- Schedule daily at 00:05 UTC (slight offset avoids midnight contention)
SELECT cron.schedule(
  'process-recurring-daily',
  '5 0 * * *',
  $$SELECT process_due_recurring_transactions()$$
);
