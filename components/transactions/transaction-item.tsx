import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/types/database.types";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
}

export function TransactionItem({ transaction, category }: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isIncome
            ? "bg-green-500/10 text-green-600"
            : isTransfer
            ? "bg-blue-500/10 text-blue-600"
            : "bg-red-500/10 text-red-600"
        )}
      >
        {isIncome ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : isTransfer ? (
          <ArrowLeftRight className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {transaction.is_opening_balance
            ? "Opening balance"
            : isTransfer
            ? "Transfer"
            : (category?.name ?? "Uncategorized")}
        </p>
        {transaction.notes && (
          <p className="text-xs text-muted-foreground truncate">{transaction.notes}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            isIncome ? "text-green-600" : isTransfer ? "" : "text-red-600"
          )}
        >
          {isIncome ? "+" : isTransfer ? "" : "−"}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(transaction.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>
    </div>
  );
}
