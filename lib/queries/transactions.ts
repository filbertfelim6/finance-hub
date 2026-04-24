import { createClient } from "@/lib/supabase/client";
import type { Transaction, TransactionType, Currency } from "@/lib/types/database.types";

export interface CreateTransactionInput {
  account_id: string;
  type: TransactionType;
  amount: number;
  balance_delta: number;
  currency: Currency;
  converted_amount_usd: number | null;
  category_id: string | null;
  notes: string | null;
  date: string;
  is_opening_balance?: boolean;
  transfer_pair_id?: string | null;
  recurring_id?: string | null;
}

export interface GetTransactionsOptions {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export async function getTransactions(
  options: GetTransactionsOptions = {}
): Promise<Transaction[]> {
  const supabase = createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.accountId) query = query.eq("account_id", options.accountId);
  if (options.type) query = query.eq("type", options.type);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.dateFrom) query = query.gte("date", options.dateFrom);
  if (options.dateTo) query = query.lte("date", options.dateTo);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Transaction[];
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_transaction_with_balance", {
    p_account_id: input.account_id,
    p_type: input.type,
    p_amount: input.amount,
    p_balance_delta: input.balance_delta,
    p_currency: input.currency,
    p_converted_amount_usd: input.converted_amount_usd,
    p_category_id: input.category_id,
    p_notes: input.notes,
    p_date: input.date,
    p_is_opening_balance: input.is_opening_balance ?? false,
    p_transfer_pair_id: input.transfer_pair_id ?? null,
    p_recurring_id: input.recurring_id ?? null,
  });
  if (error) throw error;
  return (data as Transaction[])[0];
}

export async function createTransfer(params: {
  sourceAccountId: string;
  destAccountId: string;
  amount: number;
  sourceCurrency: Currency;
  destCurrency: Currency;
  destAmount: number;
  usdToIdrRate: number;
  notes: string | null;
  date: string;
}): Promise<{ debit: Transaction; credit: Transaction }> {
  const transferPairId = crypto.randomUUID();

  const sourceConvertedUsd =
    params.sourceCurrency === "USD"
      ? params.amount
      : params.amount / params.usdToIdrRate;

  const debit = await createTransaction({
    account_id: params.sourceAccountId,
    type: "transfer",
    amount: params.amount,
    balance_delta: -params.amount,
    currency: params.sourceCurrency,
    converted_amount_usd: sourceConvertedUsd,
    category_id: null,
    notes: params.notes,
    date: params.date,
    transfer_pair_id: transferPairId,
  });

  const destConvertedUsd =
    params.destCurrency === "USD"
      ? params.destAmount
      : params.destAmount / params.usdToIdrRate;

  const credit = await createTransaction({
    account_id: params.destAccountId,
    type: "transfer",
    amount: params.destAmount,
    balance_delta: params.destAmount,
    currency: params.destCurrency,
    converted_amount_usd: destConvertedUsd,
    category_id: null,
    notes: params.notes,
    date: params.date,
    transfer_pair_id: transferPairId,
  });

  return { debit, credit };
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
