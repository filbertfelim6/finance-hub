-- accounts
CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'cash', 'ewallet')),
  currency    TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  balance     NUMERIC(20, 2) NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  icon        TEXT NOT NULL DEFAULT 'wallet',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  type      TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon      TEXT NOT NULL DEFAULT 'tag',
  color     TEXT NOT NULL DEFAULT '#6366f1',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- transactions
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount                NUMERIC(20, 2) NOT NULL,
  currency              TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  converted_amount_usd  NUMERIC(20, 2),
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes                 TEXT,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring_id          UUID,
  transfer_pair_id      UUID,
  is_opening_balance    BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- budgets
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(20, 2) NOT NULL,
  currency    TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  period      TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- savings_goals
CREATE TABLE savings_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_amount     NUMERIC(20, 2) NOT NULL,
  current_amount    NUMERIC(20, 2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  deadline          DATE,
  color             TEXT NOT NULL DEFAULT '#6366f1',
  icon              TEXT NOT NULL DEFAULT 'piggy-bank',
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- recurring_transactions
CREATE TABLE recurring_transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_template JSONB NOT NULL,
  frequency            TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date        DATE NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exchange_rates
CREATE TABLE exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency   TEXT NOT NULL,
  rate          NUMERIC(20, 8) NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);

-- Seed system categories (no user_id = available to all users)
INSERT INTO categories (id, user_id, name, type, icon, color, is_system) VALUES
  (gen_random_uuid(), NULL, 'Salary',          'income',  'briefcase',      '#22c55e', true),
  (gen_random_uuid(), NULL, 'Freelance',        'income',  'laptop',         '#22c55e', true),
  (gen_random_uuid(), NULL, 'Investment',       'income',  'trending-up',    '#22c55e', true),
  (gen_random_uuid(), NULL, 'Other Income',     'income',  'plus-circle',    '#22c55e', true),
  (gen_random_uuid(), NULL, 'Food & Drink',     'expense', 'utensils',       '#ef4444', true),
  (gen_random_uuid(), NULL, 'Transport',        'expense', 'car',            '#f97316', true),
  (gen_random_uuid(), NULL, 'Shopping',         'expense', 'shopping-bag',   '#a855f7', true),
  (gen_random_uuid(), NULL, 'Health',           'expense', 'heart',          '#ec4899', true),
  (gen_random_uuid(), NULL, 'Bills & Utilities','expense', 'zap',            '#eab308', true),
  (gen_random_uuid(), NULL, 'Entertainment',    'expense', 'tv',             '#3b82f6', true),
  (gen_random_uuid(), NULL, 'Education',        'expense', 'book',           '#06b6d4', true),
  (gen_random_uuid(), NULL, 'Travel',           'expense', 'plane',          '#8b5cf6', true),
  (gen_random_uuid(), NULL, 'Housing',          'expense', 'home',           '#64748b', true),
  (gen_random_uuid(), NULL, 'Other Expense',    'expense', 'more-horizontal','#94a3b8', true);
