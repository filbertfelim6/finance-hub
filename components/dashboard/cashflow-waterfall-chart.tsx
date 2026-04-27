"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { AccountFilter } from "@/components/dashboard/account-filter";
import { useCashFlowWaterfall } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency, TOOLTIP_STYLE } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function CashFlowWaterfallChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: accounts = [] } = useAccounts();
  const data = useCashFlowWaterfall(range, customFrom || undefined, customTo || undefined, selectedIds ?? undefined);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold pt-1">Cash Flow</h3>
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

      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis
              dataKey="name"
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
              formatter={(value: any, name: any) => {
                if (name === "base") return null;
                return [
                  isPrivate ? "••••" : formatCurrency(Number(value ?? 0), displayCurrency),
                  "Amount",
                ];
              }}
              contentStyle={TOOLTIP_STYLE}
            />
            {/* Invisible spacer bar that positions the visible bar */}
            <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
            {/* Visible colored bar */}
            <Bar dataKey="value" stackId="wf" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
