"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AccountCard } from "@/components/accounts/account-card";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useTotalNetWorth, usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { useDisplayCurrency, DISPLAY_CURRENCIES } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";
import { formatCurrency, cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { RangeKey } from "@/lib/utils/dashboard";

export default function DashboardPage() {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { data: accounts = [] } = useAccounts();
  const totalNetWorth = useTotalNetWorth();
  const [kpiRange, setKpiRange] = useState<RangeKey>("30D");
  const { income, expenses, savingsRate } = usePeriodSummary(kpiRange);
  const router = useRouter();

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

      {/* Account cards — horizontal scroll on mobile, grid on desktop */}
      {accounts.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
          {accounts.map((acc) => (
            <div key={acc.id} className="shrink-0 w-64 sm:w-auto">
              <AccountCard
                account={acc}
                onEdit={() => router.push(`/accounts?edit=${acc.id}`)}
                onArchive={() => router.push(`/accounts?archive=${acc.id}`)}
              />
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
