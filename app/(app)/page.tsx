"use client";

import { useState } from "react";
import { Eye, EyeOff, WalletCards, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAccounts } from "@/lib/hooks/use-accounts";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { RangeKey } from "@/lib/utils/dashboard";

export default function DashboardPage() {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const totalNetWorth = useTotalNetWorth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const [kpiRange, setKpiRange] = useState<RangeKey>("30D");
  const [kpiCustomFrom, setKpiCustomFrom] = useState("");
  const [kpiCustomTo, setKpiCustomTo] = useState("");
  const { income, expenses, savingsRate, isLoading: kpiLoading } = usePeriodSummary(
    kpiRange,
    kpiCustomFrom || undefined,
    kpiCustomTo || undefined,
  );

  const noAccounts = !accountsLoading && accounts.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Net Worth</p>
          {accountsLoading ? (
            <Skeleton className="h-9 w-44 mt-1" />
          ) : (
            <p className="text-3xl font-bold tabular-nums">
              {isPrivate ? "••••••" : formatCurrency(totalNetWorth, displayCurrency)}
            </p>
          )}
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period Summary</p>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Transactions <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <RangeSelector value={kpiRange} onChange={setKpiRange} />
        </div>
        {kpiRange === "custom" && (
          <div className="flex items-center gap-1 w-full">
            <input type="date" value={kpiCustomFrom} onChange={(e) => setKpiCustomFrom(e.target.value)}
              className="h-7 flex-1 min-w-0 rounded border border-input bg-background px-1.5 text-xs text-foreground" />
            <span className="text-xs text-muted-foreground shrink-0">–</span>
            <input type="date" value={kpiCustomTo} onChange={(e) => setKpiCustomTo(e.target.value)}
              className="h-7 flex-1 min-w-0 rounded border border-input bg-background px-1.5 text-xs text-foreground" />
          </div>
        )}
        <KpiStrip income={income} expenses={expenses} savingsRate={savingsRate} isLoading={kpiLoading} />
      </div>

      {/* Charts or empty state */}
      {accountsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : noAccounts ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-full bg-muted p-4">
            <WalletCards className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No accounts yet</p>
            <p className="text-sm text-muted-foreground">Add an account to start tracking your finances.</p>
          </div>
          <Link
            href="/accounts"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Add account
          </Link>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
