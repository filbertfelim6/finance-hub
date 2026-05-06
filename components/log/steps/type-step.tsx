import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types/database.types";

interface TypeStepProps {
  onSelect: (type: TransactionType) => void;
}

const TYPES = [
  { value: "expense" as const, label: "Expense", icon: ArrowUpRight, color: "text-[var(--tx-expense-text)]", bg: "bg-[var(--tx-expense-bg)]" },
  { value: "income" as const, label: "Income", icon: ArrowDownLeft, color: "text-[var(--tx-income-text)]", bg: "bg-[var(--tx-income-bg)]" },
  { value: "transfer" as const, label: "Transfer", icon: ArrowLeftRight, color: "text-[var(--tx-transfer-text)]", bg: "bg-[var(--tx-transfer-bg)]" },
];

export function TypeStep({ onSelect }: TypeStepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-center">What type?</h2>
      <div className="grid grid-cols-3 gap-3">
        {TYPES.map(({ value, label, icon: Icon, color, bg }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-5 transition-colors",
              bg
            )}
          >
            <Icon className={cn("h-6 w-6", color)} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
