"use client";

import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { useNetWorthFlowSeries } from "@/lib/hooks/use-dashboard";
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

export function CashFlowWaterfallChart() {
  const [range, setRange] = useState<RangeKey>("6M");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data, isLoading, isFetching } = useNetWorthFlowSeries(range, selectedIds ?? undefined);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = !isLoading && !isFetching && data.every((p) => p.cashFlow === 0 && p.netWorth === 0);

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Net Worth & Cash Flow</h3>
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
        <ChartSkeleton />
      ) : isEmpty ? (
        <EmptyChart />
      ) : (
        <>
          <div className="relative flex-1 min-h-[180px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  responsive
                  data={data}
                  margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
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
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={true}
                    axisLine={true}
                    interval={xInterval(range)}
                    padding={{ left: 10, right: 10 }}
                    tickFormatter={(v) => v.replace(/ 20(\d{2})/, " '$1")}
                  />
                  <YAxis
                    yAxisId="cf"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={true}
                    axisLine={true}
                    tickFormatter={(v) =>
                      isPrivate ? "••••" : formatCurrencyCompact(v, displayCurrency)
                    }
                    tickCount={5}
                    width={70}
                  />
                  <YAxis
                    yAxisId="nw"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={true}
                    axisLine={true}
                    tickFormatter={(v) =>
                      isPrivate ? "••••" : formatCurrencyCompact(v, displayCurrency)
                    }
                    tickCount={5}
                    width={70}
                  />
                  <ReferenceLine
                    yAxisId="cf"
                    y={0}
                    stroke="var(--border)"
                    strokeOpacity={1}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      isPrivate
                        ? "••••"
                        : formatCurrency(Number(value ?? 0), displayCurrency),
                      name === "cashFlow" ? "Cash Flow" : "Net Worth",
                    ]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar yAxisId="cf" dataKey="cashFlow" radius={[3, 3, 0, 0]}>
                    {data.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.cashFlow >= 0 ? "var(--chart-1)" : "var(--chart-3)"
                        }
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId={"nw"}
                    type="monotone"
                    dataKey="netWorth"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={true}
                    activeDot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--chart-1)]" />
              Gain
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--chart-3)]" />
              Loss
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 bg-[var(--chart-2)]" />
              Net Worth
            </span>
          </div>
        </>
      )}
    </div>
  );
}
