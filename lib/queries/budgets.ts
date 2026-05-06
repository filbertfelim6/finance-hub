import { createClient } from "@/lib/supabase/client";
import type { Budget, Currency, BudgetPeriod } from "@/lib/types/database.types";

export interface BudgetInput {
  category_id: string;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
}

export async function getBudgets(): Promise<Budget[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Budget[];
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("budgets")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}

export async function updateBudget(
  id: string,
  patch: Partial<BudgetInput>
): Promise<Budget> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
