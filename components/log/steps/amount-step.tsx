"use client";

import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Currency } from "@/lib/types/database.types";

interface AmountStepProps {
  amount: string;
  currency: Currency;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onNext: () => void;
}

export function AmountStep({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  onNext,
}: AmountStepProps) {
  const numericAmount = parseFloat(amount) || 0;

  function handleKey(key: string) {
    if (key === "⌫") {
      onAmountChange(amount.slice(0, -1) || "");
      return;
    }
    if (key === "." && amount.includes(".")) return;
    if (amount === "0" && key !== ".") {
      onAmountChange(key);
      return;
    }
    onAmountChange((amount || "") + key);
  }

  const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
            <SelectTrigger className="w-20 h-8 text-sm border-0 bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">IDR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <input
            readOnly
            placeholder="0"
            value={amount || ""}
            className="text-4xl font-semibold tabular-nums min-w-[4ch] bg-transparent border-none outline-none text-center w-24"
            aria-label="amount"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            className="h-14 rounded-xl bg-muted hover:bg-muted/70 text-lg font-medium transition-colors"
          >
            {k}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        disabled={numericAmount <= 0}
        onClick={onNext}
      >
        Continue
      </Button>
    </div>
  );
}
