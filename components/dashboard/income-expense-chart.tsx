"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import {
  formatCurrency,
  formatCurrencyCompact,
  TOOLTIP_STYLE,
} from "@/lib/utils";
import { EmptyChart } from "@/components/dashboard/empty-chart";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import type { RangeKey } from "@/lib/utils/dashboard";

const MONTHLY_RANGES: RangeKey[] = ["3M", "6M", "1Y"];

function xInterval(range: RangeKey): number {
  if (range === "1Y") return 2;  // 12 months → every 3rd = 4 labels
  if (range === "6M") return 1;  // 6 months → every 2nd = 3 labels
  return 0;                       // 3M → 3 labels
}

export function IncomeExpenseChart() {
  const [range, setRange] = useState<RangeKey>("6M");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { incomeExpense, isLoading, isFetching } = usePeriodSummary(
    range,
    undefined,
    undefined,
    selectedIds ?? undefined,
  );
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = !isLoading && !isFetching && incomeExpense.every((p) => p.income === 0 && p.expenses === 0);

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Income vs Expenses</h3>
        <div className="flex items-center gap-2 justify-end">
          <AccountFilter
            accounts={accounts}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
          <RangeSelector
            value={range}
            onChange={setRange}
            ranges={MONTHLY_RANGES}
          />
        </div>
      </div>

      {(isLoading || isFetching) ? (
        <ChartSkeleton className="min-h-[480px]" />
      ) : isEmpty ? (
        <EmptyChart />
      ) : (
        <div className="relative flex-1 min-h-[480px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incomeExpense}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                style={{ overflow: "visible" }}
              >
                <CartesianGrid
                  strokeDasharray="5 5"
                  stroke="var(--border)"
                  strokeOpacity={1}
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={true}
                  axisLine={true}
                  interval={xInterval(range)}
                  padding={{ left: 10, right: 10 }}
                  tickFormatter={(v) => v.replace(/ 20(\d{2})/, " '$1")}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={true}
                  axisLine={true}
                  tickFormatter={(v) =>
                    isPrivate ? "••••" : formatCurrencyCompact(v, displayCurrency)
                  }
                  tickCount={8}
                  width={75}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    isPrivate
                      ? "••••"
                      : formatCurrency(Number(value ?? 0), displayCurrency),
                    String(name).charAt(0).toUpperCase() + String(name).slice(1),
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Legend
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) =>
                    String(v).charAt(0).toUpperCase() + String(v).slice(1)
                  }
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Bar
                  dataKey="income"
                  fill="var(--chart-1)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="var(--chart-3)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
