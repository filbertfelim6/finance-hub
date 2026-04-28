"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { useCategoryTrendSeries } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency, formatCurrencyCompact, TOOLTIP_STYLE } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function CategoryTrendChart() {
  const [range, setRange] = useState<RangeKey>("90D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { series, topCategories } = useCategoryTrendSeries(range, customFrom || undefined, customTo || undefined, selectedIds ?? undefined);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = topCategories.length === 0;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Spending by Category Over Time</h3>
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
        <div className="flex-1 min-h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          No expense data in this period
        </div>
      ) : (
        <div className="relative flex-1 min-h-[200px]">
          <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
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
                  String(name),
                ]}
                contentStyle={TOOLTIP_STYLE}
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
          </div>
        </div>
      )}
    </div>
  );
}
