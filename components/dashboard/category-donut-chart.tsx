"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency, TOOLTIP_STYLE } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function CategoryDonutChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { categoryBreakdown } = usePeriodSummary(range, customFrom || undefined, customTo || undefined, selectedIds ?? undefined);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const total = categoryBreakdown.reduce((s, c) => s + c.value, 0);
  const isEmpty = categoryBreakdown.length === 0;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Spending by Category</h3>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <AccountFilter accounts={accounts} selectedIds={selectedIds} onChange={setSelectedIds} />
          <RangeSelector
            value={range}
            onChange={setRange}
            customDateFrom={customFrom}
            customDateTo={customTo}
            onCustomDateChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
          />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 min-h-[180px] flex items-center justify-center text-sm text-muted-foreground">
          No expenses in this period
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ overflow: "visible" }}>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="65%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    isPrivate ? "••••" : formatCurrency(Number(value ?? 0), displayCurrency),
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend: color swatch + name + amount + percentage */}
          <div className="space-y-1.5">
            {categoryBreakdown.map((cat) => {
              const pct = total > 0 ? (cat.value / total) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 truncate text-foreground">{cat.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {isPrivate ? "••••" : formatCurrency(cat.value, displayCurrency)}
                  </span>
                  <span className="w-10 text-right text-muted-foreground tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
