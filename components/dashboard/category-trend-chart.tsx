"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { useCategoryTrendSeries } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import {
  formatCurrency,
  formatCurrencyCompact,
  TOOLTIP_STYLE,
} from "@/lib/utils";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import type { RangeKey } from "@/lib/utils/dashboard";

function xInterval(range: RangeKey, customFrom?: string, customTo?: string): number {
  if (range === "30D") return 7;  // ~30 daily points → every 8th ≈ 4 labels
  if (range === "90D") return 3;  // ~13 weekly points → every 4th ≈ 4 labels
  if (range === "1Y") return 2;   // 12 months → every 3rd = 4 labels
  if (range === "7D") return 1;   // 7 daily points → every 2nd = 4 labels
  if (range === "custom" && customFrom && customTo) {
    const days = Math.round((new Date(customTo + "T00:00:00Z").getTime() - new Date(customFrom + "T00:00:00Z").getTime()) / 86400000);
    if (days <= 30) return Math.max(1, Math.floor(days / 4));
    if (days <= 90) return Math.max(1, Math.floor(days / 21));
    return Math.max(2, Math.floor(days / 120));
  }
  return 7; // custom with no dates yet → 30-day daily fallback, show ~4 labels
}

export function CategoryTrendChart() {
  const [range, setRange] = useState<RangeKey>("90D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { series, topCategories, isLoading, isFetching } = useCategoryTrendSeries(
    range,
    customFrom || undefined,
    customTo || undefined,
    selectedIds ?? undefined,
  );
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = !isLoading && !isFetching && topCategories.length === 0;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold">Spending by Category Over Time</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <AccountFilter
              accounts={accounts}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
            />
            <RangeSelector value={range} onChange={setRange} />
          </div>
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-1.5 sm:justify-end">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-6 w-28 rounded border border-input bg-background px-1.5 text-xs text-foreground"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-6 w-28 rounded border border-input bg-background px-1.5 text-xs text-foreground"
            />
          </div>
        )}
      </div>

      {(isLoading || isFetching) ? (
        <ChartSkeleton className="min-h-[200px]" />
      ) : isEmpty ? (
        <div className="flex-1 min-h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          No expense data in this period
        </div>
      ) : (
        <>
        <div className="relative min-h-[200px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                style={{ overflow: "visible" }}
              >
                <CartesianGrid
                  strokeDasharray="5 4"
                  stroke="var(--border)"
                  strokeOpacity={1}
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={true}
                  axisLine={true}
                  interval={xInterval(range, customFrom, customTo)}
                  padding={{ left: 10, right: 10 }}
                  tickFormatter={(v) => v.replace(/ 20(\d{2})/, " '$1")}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={true}
                  axisLine={true}
                  tickFormatter={(v) =>
                    isPrivate
                      ? "••••"
                      : formatCurrencyCompact(v, displayCurrency)
                  }
                  tickCount={5}
                  width={70}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    isPrivate
                      ? "••••"
                      : formatCurrency(Number(value ?? 0), displayCurrency),
                    String(name),
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
                {topCategories.map((cat) => (
                  <Line
                    key={cat.name}
                    type="monotone"
                    dataKey={cat.name}
                    stroke={cat.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
          {topCategories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="truncate max-w-[7rem]">{cat.name}</span>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
