"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeStep } from "./steps/type-step";
import { AmountStep } from "./steps/amount-step";
import { CategoryStep } from "./steps/category-step";
import { SplitCategoryStep } from "./steps/split-category-step";
import { AccountStep } from "./steps/account-step";
import { DetailsStep } from "./steps/details-step";
import type { TransactionType, Currency, RecurringFrequency } from "@/lib/types/database.types";
import { toast } from "sonner";
import { useCreateTransaction, useCreateTransfer } from "@/lib/hooks/use-transactions";
import { useUsdToIdr } from "@/lib/hooks/use-exchange-rate";
import { createClient } from "@/lib/supabase/client";
import { useAccounts } from "@/lib/hooks/use-accounts";

type LogStep = "type" | "amount" | "category" | "account" | "details";

interface LogState {
  type: TransactionType;
  amount: string;
  currency: Currency;
  categoryId: string | null;
  accountId: string | null;
  sourceAccountId: string | null;
  destAccountId: string | null;
  destAmount: string;
  date: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  isSplit: boolean;
  splits: Array<{ categoryId: string | null; amount: string }>;
}

const INITIAL_STATE: LogState = {
  type: "expense",
  amount: "",
  currency: "IDR",
  categoryId: null,
  accountId: null,
  sourceAccountId: null,
  destAccountId: null,
  destAmount: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  isRecurring: false,
  recurringFrequency: "monthly",
  isSplit: false,
  splits: [],
};

function getStepsForType(type: TransactionType): LogStep[] {
  if (type === "transfer") return ["type", "amount", "account", "details"];
  return ["type", "amount", "category", "account", "details"];
}

export function LogForm() {
  const [step, setStep] = useState<LogStep>("type");
  const [state, setState] = useState<LogState>(INITIAL_STATE);
  const [splitMode, setSplitMode] = useState(false);

  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();
  const usdToIdr = useUsdToIdr();
  const { data: accounts = [] } = useAccounts();

  function update(patch: Partial<LogState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function next() {
    const steps = getStepsForType(state.type);
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }

  function back() {
    const steps = getStepsForType(state.type);
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }

  function reset() {
    setState(INITIAL_STATE);
    setStep("type");
    setSplitMode(false);
  }

  async function handleSubmit() {
    try {
      const amount = parseFloat(state.amount);
      if (isNaN(amount) || amount <= 0) return;

      if (state.type === "transfer") {
        const sourceAcc = accounts.find((a) => a.id === state.sourceAccountId);
        const destAcc = accounts.find((a) => a.id === state.destAccountId);
        if (!sourceAcc || !destAcc) return;
        const destAmount = state.destAmount
          ? parseFloat(state.destAmount)
          : sourceAcc.currency === destAcc.currency
          ? amount
          : sourceAcc.currency === "USD"
          ? amount * usdToIdr
          : amount / usdToIdr;

        await createTransfer.mutateAsync({
          sourceAccountId: sourceAcc.id,
          destAccountId: destAcc.id,
          amount,
          sourceCurrency: sourceAcc.currency,
          destCurrency: destAcc.currency,
          destAmount,
          notes: state.notes || null,
          date: state.date,
        });
      } else if (state.isSplit || splitMode) {
        for (const split of state.splits) {
          const splitAmount = parseFloat(split.amount);
          if (isNaN(splitAmount) || splitAmount <= 0) continue;
          const balanceDelta = state.type === "income" ? splitAmount : -splitAmount;
          await createTransaction.mutateAsync({
            account_id: state.accountId!,
            type: state.type,
            amount: splitAmount,
            balance_delta: balanceDelta,
            currency: state.currency,
            category_id: split.categoryId,
            notes: state.notes || null,
            date: state.date,
          });
        }
      } else {
        if (!state.accountId) return;
        const balanceDelta = state.type === "income" ? amount : -amount;
        await createTransaction.mutateAsync({
          account_id: state.accountId,
          type: state.type,
          amount,
          balance_delta: balanceDelta,
          currency: state.currency,
          category_id: state.categoryId,
          notes: state.notes || null,
          date: state.date,
        });

        if (state.isRecurring) {
          const supabase = createClient();
          const nextDue = new Date(state.date);
          if (state.recurringFrequency === "daily") nextDue.setDate(nextDue.getDate() + 1);
          else if (state.recurringFrequency === "weekly") nextDue.setDate(nextDue.getDate() + 7);
          else if (state.recurringFrequency === "monthly") nextDue.setMonth(nextDue.getMonth() + 1);
          else nextDue.setFullYear(nextDue.getFullYear() + 1);

          const { error: recurringError } = await supabase
            .from("recurring_transactions")
            .insert({
              transaction_template: {
                account_id: state.accountId,
                type: state.type,
                amount,
                currency: state.currency,
                category_id: state.categoryId,
                notes: state.notes || null,
              },
              frequency: state.recurringFrequency,
              next_due_date: nextDue.toISOString().split("T")[0],
            });
          if (recurringError) throw recurringError;
        }
      }

      toast.success("Transaction saved");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transaction");
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {step !== "type" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={back}
          aria-label="back"
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}

      {step === "type" && (
        <TypeStep
          onSelect={(type) => {
            update({ type });
            const steps = getStepsForType(type);
            setStep(steps[1]);
          }}
        />
      )}

      {step === "amount" && (
        <AmountStep
          amount={state.amount}
          currency={state.currency}
          onAmountChange={(amount) => update({ amount })}
          onCurrencyChange={(currency) => update({ currency })}
          onNext={next}
        />
      )}

      {step === "category" && !splitMode && (
        <CategoryStep
          type={state.type === "income" ? "income" : "expense"}
          selectedId={state.categoryId}
          onSelect={(categoryId) => { update({ categoryId }); next(); }}
          onSplitMode={() => {
            setSplitMode(true);
            update({ splits: [{ categoryId: null, amount: "" }, { categoryId: null, amount: "" }] });
          }}
        />
      )}

      {step === "category" && splitMode && (
        <SplitCategoryStep
          totalAmount={parseFloat(state.amount) || 0}
          currency={state.currency}
          categoryType={state.type === "income" ? "income" : "expense"}
          splits={state.splits}
          onSplitsChange={(splits) => update({ splits })}
          onNext={next}
        />
      )}

      {step === "account" && (
        <AccountStep
          transactionType={state.type}
          accountId={state.accountId}
          sourceAccountId={state.sourceAccountId}
          destAccountId={state.destAccountId}
          destAmount={state.destAmount}
          onAccountSelect={(accountId) => { update({ accountId }); next(); }}
          onTransferSelect={(sourceAccountId, destAccountId, destAmount) => {
            update({ sourceAccountId, destAccountId, destAmount });
            next();
          }}
        />
      )}

      {step === "details" && (
        <DetailsStep
          state={state}
          update={update}
          onSubmit={handleSubmit}
          isPending={createTransaction.isPending || createTransfer.isPending}
        />
      )}
    </div>
  );
}
