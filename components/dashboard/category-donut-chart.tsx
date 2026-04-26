"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function CategoryDonutChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const { categoryBreakdown } = usePeriodSummary(range);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = categoryBreakdown.length === 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Spending by Category</h3>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {isEmpty ? (
        <div className="h-50 flex items-center justify-center text-sm text-muted-foreground">
          No expenses in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={categoryBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
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
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
