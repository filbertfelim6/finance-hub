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
  ReferenceLine,
} from "recharts";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { useSavingsRateSeries } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { TOOLTIP_STYLE } from "@/lib/utils";
import { EmptyChart } from "@/components/dashboard/empty-chart";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

export function SavingsRateChart() {
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data, isLoading } = useSavingsRateSeries("1Y", undefined, undefined, selectedIds ?? undefined);
  const { isPrivate } = usePrivacy();

  const isEmpty = !isLoading && data.every((p) => p.income === 0);

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Savings Rate Trend</h3>
        <AccountFilter
          accounts={accounts}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : isEmpty ? (
        <EmptyChart />
      ) : (
        <>
          <div className="relative flex-1 min-h-[180px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  style={{ overflow: "visible" }}
                >
                  <CartesianGrid
                    strokeDasharray="5 4"
                    stroke="var(--border)"
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={true}
                    axisLine={true}
                    interval={2}
                    padding={{ left: 10, right: 10 }}
                    tickFormatter={(v) => v.replace(/ 20(\d{2})/, " '$1")}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={true}
                    axisLine={true}
                    tickFormatter={(v) => (isPrivate ? "••" : `${v.toFixed(0)}%`)}
                    domain={[0, 100]}
                    tickCount={5}
                    width={36}
                  />
                  <ReferenceLine
                    y={20}
                    stroke="var(--tx-income-text)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.9}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [
                      isPrivate ? "••••" : `${Number(value ?? 0).toFixed(1)}%`,
                      "Savings Rate",
                    ]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Dashed line = 20% target</p>
        </>
      )}
    </div>
  );
}
