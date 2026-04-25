"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/hooks/use-categories";
import { formatCurrency, cn } from "@/lib/utils";
import type { CategoryType, Currency } from "@/lib/types/database.types";

interface Split {
  categoryId: string | null;
  amount: string;
}

interface SplitCategoryStepProps {
  totalAmount: number;
  currency: Currency;
  categoryType: CategoryType;
  splits: Split[];
  onSplitsChange: (splits: Split[]) => void;
  onNext: () => void;
}

export function SplitCategoryStep({
  totalAmount,
  currency,
  categoryType,
  splits,
  onSplitsChange,
  onNext,
}: SplitCategoryStepProps) {
  const { data: categories = [] } = useCategories(categoryType);

  const allocatedTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const remaining = totalAmount - allocatedTotal;
  const isBalanced = Math.abs(remaining) < 0.01;

  function addSplit() {
    onSplitsChange([...splits, { categoryId: null, amount: "" }]);
  }

  function updateSplit(index: number, patch: Partial<Split>) {
    const next = splits.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onSplitsChange(next);
  }

  function removeSplit(index: number) {
    onSplitsChange(splits.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Split</h2>
        <div className={cn("text-sm tabular-nums", isBalanced ? "text-green-600" : "text-destructive")}>
          {isBalanced
            ? "Balanced"
            : `${remaining > 0 ? "+" : ""}${formatCurrency(remaining, currency)} left`}
        </div>
      </div>

      <div className="space-y-3">
        {splits.map((split, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <select
                value={split.categoryId ?? ""}
                onChange={(e) => updateSplit(i, { categoryId: e.target.value || null })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Amount"
                value={split.amount}
                onChange={(e) => updateSplit(i, { amount: e.target.value })}
                className="h-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 mt-0.5 shrink-0"
              onClick={() => removeSplit(i)}
              disabled={splits.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addSplit} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add split
      </Button>

      <Button className="w-full" disabled={!isBalanced || splits.some((s) => !s.categoryId)} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
