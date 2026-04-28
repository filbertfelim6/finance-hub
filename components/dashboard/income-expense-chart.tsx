"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency, formatCurrencyCompact, TOOLTIP_STYLE } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function IncomeExpenseChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { incomeExpense } = usePeriodSummary(range, customFrom || undefined, customTo || undefined, selectedIds ?? undefined);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Income vs Expenses</h3>
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

      <div className="relative flex-1 min-h-[180px]">
        <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={incomeExpense} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => isPrivate ? "••••" : formatCurrencyCompact(v, displayCurrency)}
              width={70}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                isPrivate ? "••••" : formatCurrency(Number(value ?? 0), displayCurrency),
                String(name).charAt(0).toUpperCase() + String(name).slice(1),
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => String(v).charAt(0).toUpperCase() + String(v).slice(1)}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
