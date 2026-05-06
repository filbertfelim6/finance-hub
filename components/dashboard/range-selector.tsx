"use client";

import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

const DEFAULT_RANGES: RangeKey[] = ["7D", "30D", "90D", "1Y", "custom"];

interface RangeSelectorProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
  ranges?: RangeKey[];
  className?: string;
}

export function RangeSelector({
  value,
  onChange,
  ranges = DEFAULT_RANGES,
  className,
}: RangeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 justify-end", className)}>
      {ranges.map((r) => (
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
    </div>
  );
}
