"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function IncomeExpenseChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const { incomeExpense } = usePeriodSummary(range);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Income vs Expenses</h3>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={incomeExpense} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            tickFormatter={(v) => isPrivate ? "••••" : formatCurrency(v, displayCurrency)}
            width={70}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [
              isPrivate ? "••••" : formatCurrency(Number(value ?? 0), displayCurrency),
              String(name).charAt(0).toUpperCase() + String(name).slice(1),
            ]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
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
  );
}
