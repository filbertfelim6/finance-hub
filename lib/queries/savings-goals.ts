import { createClient } from "@/lib/supabase/client";
import { createTransaction } from "@/lib/queries/transactions";
import type { SavingsGoal, Currency } from "@/lib/types/database.types";

export interface SavingsGoalInput {
  name: string;
  target_amount: number;
  currency: Currency;
  deadline?: string | null;
  color: string;
  icon: string;
  linked_account_id?: string | null;
}

export interface AddContributionInput {
  goalId: string;
  goalName: string;
  goalCurrency: Currency;
  amount: number;
  accountId: string;
  accountCurrency: Currency;
  accountBalance: number;
  ratesFromUsd: Record<string, number>;
}

function convertViaUsd(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount / fromRate) * toRate;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as SavingsGoal[];
}

export async function createSavingsGoal(input: SavingsGoalInput): Promise<SavingsGoal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: user.id,
      name: input.name,
      target_amount: input.target_amount,
      current_amount: 0,
      currency: input.currency,
      deadline: input.deadline ?? null,
      color: input.color,
      icon: input.icon,
      linked_account_id: input.linked_account_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SavingsGoal;
}

export async function updateSavingsGoal(
  id: string,
  patch: Partial<SavingsGoalInput>
): Promise<SavingsGoal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as SavingsGoal;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}

export async function addContribution(input: AddContributionInput): Promise<SavingsGoal> {
  const supabase = createClient();

  // Convert amount to account currency for balance check and balance_delta
  const amountInAccountCurrency = convertViaUsd(
    input.amount, input.goalCurrency, input.accountCurrency, input.ratesFromUsd
  );

  // Balance check
  if (input.accountBalance < amountInAccountCurrency) {
    const shortfall = amountInAccountCurrency - input.accountBalance;
    throw new Error(
      `Insufficient balance. Short by ${shortfall.toFixed(2)} ${input.accountCurrency}.`
    );
  }

  // Find or create "Goals" expense category
  const { data: existingCats } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "Goals")
    .eq("type", "expense")
    .limit(1);

  let categoryId: string | null = null;
  if (existingCats && existingCats.length > 0) {
    categoryId = existingCats[0].id;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: newCat } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: "Goals",
          type: "expense",
          icon: "target",
          color: "#5a7a8e",
          is_system: false,
        })
        .select("id")
        .single();
      if (newCat) categoryId = (newCat as { id: string }).id;
    }
  }

  // Create expense transaction
  const today = new Date().toISOString().split("T")[0];
  const convertedUsd = convertViaUsd(input.amount, input.goalCurrency, "USD", input.ratesFromUsd);

  await createTransaction({
    account_id: input.accountId,
    type: "expense",
    amount: input.amount,
    balance_delta: -amountInAccountCurrency,
    currency: input.goalCurrency,
    converted_amount_usd: convertedUsd,
    category_id: categoryId,
    notes: `Goal: ${input.goalName}`,
    date: today,
  });

  // Update goal current_amount
  const { data: goal, error: fetchErr } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", input.goalId)
    .single();
  if (fetchErr) throw fetchErr;

  const { data, error } = await supabase
    .from("savings_goals")
    .update({ current_amount: (goal.current_amount as number) + input.amount })
    .eq("id", input.goalId)
    .select()
    .single();
  if (error) throw error;
  return data as SavingsGoal;
}
