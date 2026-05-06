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
import { useExchangeRates } from "@/lib/hooks/use-exchange-rate";
import { createClient } from "@/lib/supabase/client";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { getBalanceDeltaAfterDate } from "@/lib/queries/accounts";
import { cn, convertCurrency, formatCurrency } from "@/lib/utils";

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
  destCurrency: Currency;
  date: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  isSplit: boolean;
  splits: Array<{ id: string; categoryId: string | null; amount: string }>;
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
  destCurrency: "IDR",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  isRecurring: false,
  recurringFrequency: "monthly",
  isSplit: false,
  splits: [],
};

function getStepsForType(type: TransactionType): LogStep[] {
  if (type === "transfer") return ["type", "account", "details"];
  return ["type", "amount", "category", "account", "details"];
}

export function LogForm() {
  const [step, setStep] = useState<LogStep>("type");
  const [state, setState] = useState<LogState>(INITIAL_STATE);
  const [splitMode, setSplitMode] = useState(false);

  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();
  const rates = useExchangeRates();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

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
    if (idx <= 0) return;

    const prevStep = steps[idx - 1];

    // Going back to type → full reset so old state doesn't bleed into next entry
    if (prevStep === "type") {
      setState(INITIAL_STATE);
      setStep("type");
      setSplitMode(false);
      return;
    }

    // Clear state owned by the step we're leaving
    const patch: Partial<LogState> = {};
    if (step === "amount") {
      patch.amount = "";
      patch.currency = "IDR";
    } else if (step === "category") {
      patch.categoryId = null;
      patch.isSplit = false;
      patch.splits = [];
      setSplitMode(false);
    } else if (step === "account") {
      if (state.type === "transfer") {
        patch.sourceAccountId = null;
        patch.destAccountId = null;
        patch.amount = "";
        patch.currency = "IDR";
        patch.destAmount = "";
        patch.destCurrency = "IDR";
      } else {
        patch.accountId = null;
      }
    }

    update(patch);
    setStep(prevStep);
  }

  function reset() {
    setState(INITIAL_STATE);
    setStep("type");
    setSplitMode(false);
  }

  function checkSufficientBalance(
    accountId: string,
    deductionInTxnCurrency: number,
    txnCurrency: string
  ): boolean {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return true;
    const deduction = convertCurrency(deductionInTxnCurrency, txnCurrency, account.currency, rates);
    if (account.balance - deduction < 0) {
      toast.error(
        `Insufficient balance in ${account.name}. Available: ${formatCurrency(account.balance, account.currency)}`
      );
      return false;
    }
    return true;
  }

  async function checkSufficientBalanceAtDate(
    accountId: string,
    deductionInTxnCurrency: number,
    txnCurrency: string,
    date: string
  ): Promise<boolean> {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return true;
    const deduction = convertCurrency(deductionInTxnCurrency, txnCurrency, account.currency, rates);

    const today = new Date().toISOString().split("T")[0];
    let effectiveBalance = account.balance;

    if (date < today) {
      const futureDelta = await getBalanceDeltaAfterDate(accountId, date);
      effectiveBalance = account.balance - futureDelta;
    }

    if (effectiveBalance - deduction < 0) {
      const available = formatCurrency(Math.max(0, effectiveBalance), account.currency);
      const when = date < today ? ` on ${date}` : "";
      toast.error(`Insufficient balance in ${account.name}${when}. Available: ${available}`);
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    try {
      if (state.type === "transfer") {
        if (!state.sourceAccountId || !state.destAccountId) return;
        const sourceAmount = parseFloat(state.amount);
        const destAmt = parseFloat(state.destAmount);
        if (isNaN(sourceAmount) || sourceAmount <= 0) return;
        if (isNaN(destAmt) || destAmt <= 0) return;

        if (!(await checkSufficientBalanceAtDate(state.sourceAccountId, sourceAmount, state.currency, state.date))) return;

        const sourceAccount = accounts.find((a) => a.id === state.sourceAccountId);
        const destAccount = accounts.find((a) => a.id === state.destAccountId);

        await createTransfer.mutateAsync({
          sourceAccountId: state.sourceAccountId,
          sourceAccountName: sourceAccount?.name ?? "Source",
          destAccountId: state.destAccountId,
          destAccountName: destAccount?.name ?? "Destination",
          amount: sourceAmount,
          sourceCurrency: state.currency,
          sourceAccountCurrency: sourceAccount?.currency ?? state.currency,
          destCurrency: state.destCurrency,
          destAccountCurrency: destAccount?.currency ?? state.destCurrency,
          destAmount: destAmt,
          notes: state.notes || null,
          date: state.date,
        });
      } else if (state.isSplit || splitMode) {
        if (state.type === "expense" && state.accountId) {
          const total = state.splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
          if (!(await checkSufficientBalanceAtDate(state.accountId, total, state.currency, state.date))) return;
        }
        const splitAccount = accounts.find((a) => a.id === state.accountId);
        for (const split of state.splits) {
          const splitAmount = parseFloat(split.amount);
          if (isNaN(splitAmount) || splitAmount <= 0) continue;
          const splitInAccountCurrency = convertCurrency(
            splitAmount, state.currency, splitAccount?.currency ?? state.currency, rates
          );
          const balanceDelta = state.type === "income" ? splitInAccountCurrency : -splitInAccountCurrency;
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
        const amount = parseFloat(state.amount);
        if (isNaN(amount) || amount <= 0) return;
        if (state.type === "expense") {
          if (!(await checkSufficientBalanceAtDate(state.accountId, amount, state.currency, state.date))) return;
        }
        const account = accounts.find((a) => a.id === state.accountId);
        const amountInAccountCurrency = convertCurrency(
          amount, state.currency, account?.currency ?? state.currency, rates
        );
        const balanceDelta = state.type === "income" ? amountInAccountCurrency : -amountInAccountCurrency;
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
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const nextDue = new Date(state.date);
          if (state.recurringFrequency === "daily") nextDue.setDate(nextDue.getDate() + 1);
          else if (state.recurringFrequency === "weekly") nextDue.setDate(nextDue.getDate() + 7);
          else if (state.recurringFrequency === "monthly") nextDue.setMonth(nextDue.getMonth() + 1);
          else nextDue.setFullYear(nextDue.getFullYear() + 1);

          const { error: recurringError } = await supabase
            .from("recurring_transactions")
            .insert({
              user_id: user.id,
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
    <div className="w-full max-w-sm mx-auto">
      {step !== "type" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={back}
          aria-label="back"
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}

      {step !== "type" && (
        <div className="flex flex-wrap gap-1.5 my-3 min-h-[24px]">
          {/* Type */}
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            state.type === "income" && "bg-green-500/10 text-green-700 dark:text-green-400",
            state.type === "expense" && "bg-red-500/10 text-red-700 dark:text-red-400",
            state.type === "transfer" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
          )}>
            {state.type.charAt(0).toUpperCase() + state.type.slice(1)}
          </span>

          {/* Amount */}
          {state.type !== "transfer" && state.amount && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {formatCurrency(parseFloat(state.amount), state.currency)}
            </span>
          )}

          {/* Category / Split */}
          {splitMode ? (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              Split
            </span>
          ) : state.categoryId ? (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {categories.find((c) => c.id === state.categoryId)?.name ?? "Category"}
            </span>
          ) : null}

          {/* Account (income/expense) */}
          {state.type !== "transfer" && state.accountId && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {accounts.find((a) => a.id === state.accountId)?.name ?? "Account"}
            </span>
          )}

          {/* Transfer: source → dest + amounts */}
          {state.type === "transfer" && state.sourceAccountId && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {accounts.find((a) => a.id === state.sourceAccountId)?.name ?? "Source"}
              {" → "}
              {state.destAccountId
                ? (accounts.find((a) => a.id === state.destAccountId)?.name ?? "Dest")
                : "?"}
            </span>
          )}
          {state.type === "transfer" && state.amount && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {formatCurrency(parseFloat(state.amount), state.currency)}
              {state.destAmount && state.destCurrency !== state.currency
                ? ` → ${formatCurrency(parseFloat(state.destAmount), state.destCurrency)}`
                : ""}
            </span>
          )}
        </div>
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
            update({
              isSplit: true,
              splits: [
                { id: crypto.randomUUID(), categoryId: null, amount: "" },
                { id: crypto.randomUUID(), categoryId: null, amount: "" },
              ],
            });
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
          sourceAmount={state.amount}
          sourceCurrency={state.currency}
          destAmount={state.destAmount}
          destCurrency={state.destCurrency}
          rates={rates}
          onAccountSelect={(accountId) => {
            if (state.type === "expense") {
              const deduction = (state.isSplit || splitMode)
                ? state.splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0)
                : parseFloat(state.amount) || 0;
              if (!checkSufficientBalance(accountId, deduction, state.currency)) return;
            }
            update({ accountId });
            next();
          }}
          onTransferSelect={(sourceAccountId, destAccountId, sourceAmount, sourceCurrency, destAmount, destCurrency) => {
            if (!checkSufficientBalance(sourceAccountId, parseFloat(sourceAmount) || 0, sourceCurrency)) return;
            update({ sourceAccountId, destAccountId, amount: sourceAmount, currency: sourceCurrency, destAmount, destCurrency });
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
