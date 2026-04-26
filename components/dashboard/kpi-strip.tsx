"use client";

import { TrendingUp, TrendingDown, Percent } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";

interface KpiStripProps {
  income: number;
  expenses: number;
  savingsRate: number;
}

export function KpiStrip({ income, expenses, savingsRate }: KpiStripProps) {
  const { displayCurrency } = useDisplayCurrency();
  const { isPrivate } = usePrivacy();
  const mask = "••••";

  const items = [
    {
      label: "Income",
      value: isPrivate ? mask : formatCurrency(income, displayCurrency),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Expenses",
      value: isPrivate ? mask : formatCurrency(expenses, displayCurrency),
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Savings Rate",
      value: isPrivate ? mask : `${savingsRate.toFixed(1)}%`,
      icon: Percent,
      color: savingsRate >= 20 ? "text-green-600 dark:text-green-400" : savingsRate >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400",
      bg: savingsRate >= 20 ? "bg-green-500/10" : savingsRate >= 10 ? "bg-yellow-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-xl border bg-card p-3 space-y-2">
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", bg)}>
            <Icon className={cn("h-3.5 w-3.5", color)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold tabular-nums truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
