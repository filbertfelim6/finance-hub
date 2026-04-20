-- Enable RLS on all user-scoped tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- accounts: users own their rows
CREATE POLICY "users_own_accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions: users own their rows
CREATE POLICY "users_own_transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- categories: users see system categories (user_id IS NULL) + their own
CREATE POLICY "users_see_own_and_system_categories"
  ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "users_manage_own_categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- budgets: users own their rows
CREATE POLICY "users_own_budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- savings_goals: users own their rows
CREATE POLICY "users_own_savings_goals"
  ON savings_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- recurring_transactions: users own their rows
CREATE POLICY "users_own_recurring"
  ON recurring_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- exchange_rates: public read, no user write (only service role via cron)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_public_read"
  ON exchange_rates FOR SELECT
  USING (true);
