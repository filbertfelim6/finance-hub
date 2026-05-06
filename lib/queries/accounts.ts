import { createClient } from "@/lib/supabase/client";
import type { Account, AccountType, Currency } from "@/lib/types/database.types";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  color: string;
  icon: string;
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Account[];
}

export async function getAccount(id: string): Promise<Account> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Account;
}

export async function createAccount(
  input: CreateAccountInput,
  ratesFromUsd: Record<string, number>
): Promise<Account> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance: 0,
      color: input.color,
      icon: input.icon,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.initialBalance > 0) {
    const convertedUsd = input.initialBalance / (ratesFromUsd[input.currency] ?? 1);
    const { error: txnError } = await supabase.rpc(
      "create_transaction_with_balance",
      {
        p_account_id: account.id,
        p_type: "income",
        p_amount: input.initialBalance,
        p_balance_delta: input.initialBalance,
        p_currency: input.currency,
        p_converted_amount_usd: convertedUsd,
        p_category_id: null,
        p_notes: "Opening balance",
        p_date: new Date().toISOString().split("T")[0],
        p_is_opening_balance: true,
        p_transfer_pair_id: null,
        p_recurring_id: null,
      }
    );
    if (txnError) {
      // Best-effort cleanup: delete orphan account row before surfacing the error
      await supabase.from("accounts").delete().eq("id", account.id);
      throw txnError;
    }
  }

  return getAccount(account.id);
}

export async function updateAccount(
  id: string,
  input: Partial<Omit<CreateAccountInput, "initialBalance">>
): Promise<Account> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Account;
}

export async function getBalanceDeltaAfterDate(
  accountId: string,
  date: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("balance_delta")
    .eq("account_id", accountId)
    .eq("is_opening_balance", false)
    .gt("date", date);
  if (error) throw error;
  return (data as { balance_delta: number | null }[]).reduce(
    (s, t) => s + (t.balance_delta ?? 0),
    0
  );
}

export async function archiveAccount(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) throw error;
}
