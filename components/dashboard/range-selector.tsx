"use client";

import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

const RANGES: RangeKey[] = ["7D", "30D", "90D", "1Y", "custom"];

interface RangeSelectorProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
  customDateFrom?: string;
  customDateTo?: string;
  onCustomDateChange?: (from: string, to: string) => void;
  className?: string;
}

export function RangeSelector({
  value,
  onChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
  className,
}: RangeSelectorProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 justify-end", className)}>
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            value === r
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {r === "custom" ? "Custom" : r}
        </button>
      ))}
      {value === "custom" && (
        <div className="flex items-center gap-1 w-full mt-1">
          <input
            type="date"
            value={customDateFrom ?? ""}
            onChange={(e) => onCustomDateChange?.(e.target.value, customDateTo ?? "")}
            className="h-6 flex-1 min-w-0 rounded border border-input bg-background px-1.5 text-xs text-foreground"
          />
          <span className="text-xs text-muted-foreground shrink-0">–</span>
          <input
            type="date"
            value={customDateTo ?? ""}
            onChange={(e) => onCustomDateChange?.(customDateFrom ?? "", e.target.value)}
            className="h-6 flex-1 min-w-0 rounded border border-input bg-background px-1.5 text-xs text-foreground"
          />
        </div>
      )}
    </div>
  );
}
