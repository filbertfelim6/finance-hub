import { createClient } from "@/lib/supabase/client";
import type { RecurringTransaction, TransactionType, Currency, RecurringFrequency } from "@/lib/types/database.types";

export interface RecurringInput {
  label: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  account_id: string;
  category_id?: string | null;
  frequency: RecurringFrequency;
  next_due_date: string;
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .order("next_due_date", { ascending: true });
  if (error) throw error;
  return data as RecurringTransaction[];
}

export async function createRecurring(input: RecurringInput): Promise<RecurringTransaction> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id: user.id,
      transaction_template: {
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        account_id: input.account_id,
        category_id: input.category_id ?? null,
        notes: input.label,
      },
      frequency: input.frequency,
      next_due_date: input.next_due_date,
    })
    .select()
    .single();
  if (error) throw error;
  return data as RecurringTransaction;
}

export async function updateRecurring(
  id: string,
  input: RecurringInput
): Promise<RecurringTransaction> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update({
      transaction_template: {
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        account_id: input.account_id,
        category_id: input.category_id ?? null,
        notes: input.label,
      },
      frequency: input.frequency,
      next_due_date: input.next_due_date,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RecurringTransaction;
}

export async function deleteRecurring(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
