export type AccountType = "checking" | "savings" | "cash" | "ewallet";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type BudgetPeriod = "monthly" | "weekly";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type Currency = "USD" | "IDR";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  color: string;
  icon: string;
  is_archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  converted_amount_usd: number | null;
  category_id: string | null;
  notes: string | null;
  date: string;
  recurring_id: string | null;
  transfer_pair_id: string | null;
  is_opening_balance: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  deadline: string | null;
  color: string;
  icon: string;
  linked_account_id: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  transaction_template: Partial<Transaction>;
  frequency: RecurringFrequency;
  next_due_date: string;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  fetched_at: string;
}
