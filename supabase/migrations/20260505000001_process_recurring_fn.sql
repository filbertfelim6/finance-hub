-- Processes all recurring_transactions whose next_due_date <= today.
-- Called by pg_cron daily, or manually via the process-recurring edge function.
-- Returns { processed, skipped, date }.
CREATE OR REPLACE FUNCTION process_due_recurring_transactions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec          recurring_transactions%ROWTYPE;
  v_tmpl         jsonb;
  v_user_id      uuid;
  v_account_id   uuid;
  v_amount       numeric;
  v_currency     text;
  v_acc_currency text;
  v_from_rate    numeric;
  v_to_rate      numeric;
  v_balance_delta   numeric;
  v_converted_usd   numeric;
  v_next_date    date;
  v_processed    int := 0;
  v_skipped      int := 0;
  v_today        date := CURRENT_DATE;
BEGIN
  FOR v_rec IN
    SELECT * FROM recurring_transactions
    WHERE next_due_date <= v_today
    ORDER BY user_id, next_due_date ASC
  LOOP
    v_tmpl       := v_rec.transaction_template;
    v_user_id    := v_rec.user_id;
    v_account_id := (v_tmpl->>'account_id')::uuid;
    v_amount     := (v_tmpl->>'amount')::numeric;
    v_currency   := v_tmpl->>'currency';

    -- Skip legacy records created before account_id was added to the template
    IF v_account_id IS NULL THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Verify the account exists and belongs to this user
    SELECT currency INTO v_acc_currency
    FROM accounts
    WHERE id = v_account_id AND user_id = v_user_id;

    IF NOT FOUND THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Fetch exchange rates (units per 1 USD). Fall back to hardcoded values
    -- if the exchange_rates table is missing a row.
    SELECT COALESCE(
      (SELECT rate FROM exchange_rates
       WHERE from_currency = 'USD' AND to_currency = v_currency),
      CASE v_currency
        WHEN 'USD' THEN 1
        WHEN 'IDR' THEN 16000
        WHEN 'EUR' THEN 0.92
        WHEN 'GBP' THEN 0.79
        WHEN 'SGD' THEN 1.35
        WHEN 'JPY' THEN 154
        ELSE 1
      END
    ) INTO v_from_rate;

    SELECT COALESCE(
      (SELECT rate FROM exchange_rates
       WHERE from_currency = 'USD' AND to_currency = v_acc_currency),
      CASE v_acc_currency
        WHEN 'USD' THEN 1
        WHEN 'IDR' THEN 16000
        WHEN 'EUR' THEN 0.92
        WHEN 'GBP' THEN 0.79
        WHEN 'SGD' THEN 1.35
        WHEN 'JPY' THEN 154
        ELSE 1
      END
    ) INTO v_to_rate;

    -- amount → USD → account currency
    v_converted_usd := v_amount / v_from_rate;
    v_balance_delta := v_converted_usd * v_to_rate;

    -- Expense debits the account; income credits it
    IF v_tmpl->>'type' = 'expense' THEN
      v_balance_delta := -v_balance_delta;
    END IF;

    -- Insert the transaction
    INSERT INTO transactions (
      user_id, account_id, type, amount, balance_delta, currency,
      converted_amount_usd, category_id, notes, date,
      is_opening_balance, transfer_pair_id, recurring_id
    ) VALUES (
      v_user_id,
      v_account_id,
      v_tmpl->>'type',
      v_amount,
      v_balance_delta,
      v_currency,
      v_converted_usd,
      CASE
        WHEN (v_tmpl->>'category_id') IS NOT NULL AND (v_tmpl->>'category_id') <> ''
        THEN (v_tmpl->>'category_id')::uuid
        ELSE NULL
      END,
      v_tmpl->>'notes',
      v_today,
      false,
      null,
      v_rec.id
    );

    -- Update account balance
    UPDATE accounts
    SET balance = balance + v_balance_delta
    WHERE id = v_account_id AND user_id = v_user_id;

    -- Advance next_due_date by the recurring frequency
    v_next_date := CASE v_rec.frequency
      WHEN 'daily'   THEN v_rec.next_due_date + INTERVAL '1 day'
      WHEN 'weekly'  THEN v_rec.next_due_date + INTERVAL '7 days'
      WHEN 'monthly' THEN v_rec.next_due_date + INTERVAL '1 month'
      WHEN 'yearly'  THEN v_rec.next_due_date + INTERVAL '1 year'
      ELSE                v_rec.next_due_date + INTERVAL '1 month'
    END;

    UPDATE recurring_transactions
    SET next_due_date = v_next_date::date
    WHERE id = v_rec.id;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'skipped',   v_skipped,
    'date',      v_today
  );
END;
$$;
