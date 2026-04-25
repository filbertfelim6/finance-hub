"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeStep } from "./steps/type-step";
import { AmountStep } from "./steps/amount-step";
import { CategoryStep } from "./steps/category-step";
import { AccountStep } from "./steps/account-step";
import { DetailsStep } from "./steps/details-step";
import type { TransactionType, Currency, RecurringFrequency } from "@/lib/types/database.types";

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

      {step === "category" && (
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

      {step === "account" && (
        <AccountStep
          transactionType={state.type}
          accountId={state.accountId}
          sourceAccountId={state.sourceAccountId}
          destAccountId={state.destAccountId}
          destAmount={state.destAmount}
          sourceCurrency={state.currency}
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
          onSubmit={reset}
        />
      )}
    </div>
  );
}
