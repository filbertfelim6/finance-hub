"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { SavingsRateChart } from "@/components/dashboard/savings-rate-chart";
import { CategoryTrendChart } from "@/components/dashboard/category-trend-chart";
import { CashFlowWaterfallChart } from "@/components/dashboard/cashflow-waterfall-chart";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { useTotalNetWorth, usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { useDisplayCurrency, DISPLAY_CURRENCIES } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";
import { formatCurrency, cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { RangeKey } from "@/lib/utils/dashboard";

export default function DashboardPage() {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const totalNetWorth = useTotalNetWorth();
  const [kpiRange, setKpiRange] = useState<RangeKey>("30D");
  const { income, expenses, savingsRate } = usePeriodSummary(kpiRange);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Net Worth</p>
          <p className="text-3xl font-bold tabular-nums">
            {isPrivate ? "••••••" : formatCurrency(totalNetWorth, displayCurrency)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={displayCurrency} onValueChange={(v) => v && setDisplayCurrency(v)}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-xs">
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={togglePrivacy}
            aria-label={isPrivate ? "Show balances" : "Hide balances"}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
          >
            {isPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* KPI strip with its own range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period Summary</p>
          <RangeSelector value={kpiRange} onChange={setKpiRange} />
        </div>
        <KpiStrip income={income} expenses={expenses} savingsRate={savingsRate} />
      </div>

      {/* Charts */}
      <NetWorthChart />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IncomeExpenseChart />
        <CategoryDonutChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SavingsRateChart />
        <CashFlowWaterfallChart />
      </div>

      <CategoryTrendChart />
    </div>
  );
}
