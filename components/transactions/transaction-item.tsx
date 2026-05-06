"use client";

import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
} from "lucide-react";
import { formatCurrency, convertCurrency, cn } from "@/lib/utils";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rate";
import type { Transaction, Category } from "@/lib/types/database.types";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
}

export function TransactionItem({ transaction, category }: TransactionItemProps) {
  const { displayCurrency } = useDisplayCurrency();
  const rates = useExchangeRates();
  const displayAmount = convertCurrency(transaction.amount, transaction.currency, displayCurrency, rates);
  const showNative = displayCurrency !== transaction.currency;

  const delta = transaction.balance_delta;

  // credit: money coming in; debit: money going out; neutral: old transfer rows with no delta
  const isCredit = delta !== null ? delta > 0 : transaction.type === "income";
  const isDebit  = delta !== null ? delta < 0 : transaction.type === "expense";

  const isTransfer = transaction.type === "transfer";

  const iconBg = isTransfer
    ? "bg-[var(--tx-transfer-bg)] text-[var(--tx-transfer-text)]"
    : isCredit
    ? "bg-[var(--tx-income-bg)] text-[var(--tx-income-text)]"
    : "bg-[var(--tx-expense-bg)] text-[var(--tx-expense-text)]";

  const amountColor = isCredit
    ? "text-[var(--tx-income-text)]"
    : isDebit
    ? "text-[var(--tx-expense-text)]"
    : "text-muted-foreground";
  const sign = isCredit ? "+" : isDebit ? "−" : "";

  const Icon = isTransfer ? ArrowLeftRight : isCredit ? ArrowDownLeft : ArrowUpRight;

  const label = transaction.type === "transfer"
    ? (transaction.notes ?? "Transfer")
    : (category?.name ?? "Uncategorized");

  const subLabel = transaction.type !== "transfer" && transaction.notes
    ? transaction.notes
    : null;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", iconBg)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {new Date(transaction.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          {subLabel && ` · ${subLabel}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-medium tabular-nums", amountColor)}>
          {sign}{formatCurrency(displayAmount, displayCurrency)}
        </p>
        {showNative && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {sign}{formatCurrency(transaction.amount, transaction.currency)}
          </p>
        )}
      </div>
    </div>
  );
}
