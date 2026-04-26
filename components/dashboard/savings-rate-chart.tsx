"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useSavingsRateSeries } from "@/lib/hooks/use-dashboard";
import { usePrivacy } from "@/lib/context/privacy-context";

export function SavingsRateChart() {
  const data = useSavingsRateSeries();
  const { isPrivate } = usePrivacy();

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Savings Rate Trend</h3>
        <span className="text-xs text-muted-foreground">Last 12 months</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            tickFormatter={(v) => isPrivate ? "••" : `${v.toFixed(0)}%`}
            domain={[0, 100]}
            width={36}
          />
          <ReferenceLine y={20} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [
              isPrivate ? "••••" : `${Number(value ?? 0).toFixed(1)}%`,
              "Savings Rate",
            ]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-muted-foreground">Dashed line = 20% target</p>
    </div>
  );
}
