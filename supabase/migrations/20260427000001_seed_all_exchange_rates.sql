-- Seed USD-base rates for all supported currencies.
-- Uses ON CONFLICT DO UPDATE so re-running is safe; live rates can override these later.
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES
  ('USD', 'IDR', 16000.00),
  ('USD', 'JPY',   154.50),
  ('USD', 'EUR',     0.92),
  ('USD', 'GBP',     0.79),
  ('USD', 'SGD',     1.35)
ON CONFLICT (from_currency, to_currency)
DO UPDATE SET rate = EXCLUDED.rate, fetched_at = now();
