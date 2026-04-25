import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types/database.types";

interface TypeStepProps {
  onSelect: (type: TransactionType) => void;
}

const TYPES = [
  { value: "expense" as const, label: "Expense", icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-500/10 hover:bg-red-500/20" },
  { value: "income" as const, label: "Income", icon: ArrowDownLeft, color: "text-green-500", bg: "bg-green-500/10 hover:bg-green-500/20" },
  { value: "transfer" as const, label: "Transfer", icon: ArrowLeftRight, color: "text-blue-500", bg: "bg-blue-500/10 hover:bg-blue-500/20" },
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
