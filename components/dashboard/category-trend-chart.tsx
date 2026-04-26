"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { useCategoryTrendSeries } from "@/lib/hooks/use-dashboard";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function CategoryTrendChart() {
  const [range, setRange] = useState<RangeKey>("90D");
  const { series, topCategories } = useCategoryTrendSeries(range);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = topCategories.length === 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Spending by Category Over Time</h3>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {isEmpty ? (
        <div className="h-50 flex items-center justify-center text-sm text-muted-foreground">
          No expense data in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                String(name),
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
      )}
    </div>
  );
}
