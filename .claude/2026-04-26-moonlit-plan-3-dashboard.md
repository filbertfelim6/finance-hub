# Moonlit Plan 3 — Dashboard & Visualizations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional dashboard at `/` that shows net worth, account balances, income/expense breakdown, category spending, and savings rate — all responsive, privacy-aware, and respecting the display currency preference.

**Architecture:** All data fetching reuses existing hooks (`useAccounts`, `useTransactions`, `useCategories`, `useExchangeRates`, `useDisplayCurrency`). New pure utility functions in `lib/utils/dashboard.ts` transform raw data into chart-ready shapes — these are the only genuinely new logic units and get unit tests. Recharts renders all charts inside `ResponsiveContainer`. Privacy mode is a new localStorage-persisted context. Layout: single responsive grid (layout variants deferred to Plan 4).

**Tech Stack:** Next.js 15 App Router, TypeScript, Recharts, TanStack Query v5, Supabase, Tailwind CSS v4, shadcn/ui, Vitest.

**Scope (Plan 3 only):**
- ✅ Net worth header + total across all accounts
- ✅ Account cards row (reuse existing `AccountCard`)
- ✅ KPI strip: Period Income, Period Expenses, Savings Rate
- ✅ Net worth area chart (stacked by account, with range selector)
- ✅ Income vs expenses grouped bar chart (with range selector)
- ✅ Category expense donut chart (with range selector)
- ✅ Privacy mode (hide all figures, localStorage-persisted)
- ❌ Budget-vs-actual chart (Plan 4 — needs budgets)
- ❌ Forecast line (Plan 4 — needs recurring processing)
- ❌ Financial Health Score (Plan 4 — needs budgets + goals)
- ❌ Dashboard layout variants A/B/C (Plan 4 — settings integration)

---

## File Map

**New files:**
```
lib/context/privacy-context.tsx
lib/utils/dashboard.ts
lib/hooks/use-dashboard.ts
components/dashboard/range-selector.tsx
components/dashboard/kpi-strip.tsx
components/dashboard/net-worth-chart.tsx
components/dashboard/income-expense-chart.tsx
components/dashboard/category-donut-chart.tsx
__tests__/lib/utils/dashboard.test.ts
```

**Modified files:**
```
app/(app)/layout.tsx         ← add PrivacyProvider
app/(app)/page.tsx           ← replace placeholder with full dashboard
```

**No new DB migrations needed.** All required data (`balance_delta`, `converted_amount_usd`, `date`, `account_id`, `type`, `category_id`) already exists in transactions table.

---

## Key Data Contracts

### RangeKey
```typescript
export type RangeKey = "7D" | "30D" | "90D" | "1Y";
// granularity: 7D/30D → daily, 90D → weekly, 1Y → monthly
```

### NetWorthPoint
```typescript
// One point per day/week/month in selected range
// Keys are account IDs (for stacking) plus "date" label
export interface NetWorthPoint {
  date: string;               // display label e.g. "Apr 21"
  [accountId: string]: number | string;
}
```

### IncomeExpensePoint
```typescript
export interface IncomeExpensePoint {
  period: string;   // display label
  income: number;   // in display currency
  expenses: number; // in display currency
}
```

### CategoryPoint
```typescript
export interface CategoryPoint {
  name: string;
  value: number; // in display currency
  color: string;
}
```

---

## Task 1: Install Recharts

**Files:** `package.json`

- [ ] **Step 1: Install**
```bash
cd "/Users/filbertfelim/Filbert Felim/Claude/moonlit"
npm install recharts
```

- [ ] **Step 2: Verify TypeScript resolves it**
```bash
npx tsc --noEmit
```
Expected: no errors about recharts.

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: install recharts for dashboard charts"
```

---

## Task 2: Privacy Mode Context

**Files:**
- Create: `lib/context/privacy-context.tsx`
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Write the context**

```typescript
// lib/context/privacy-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextValue {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  isPrivate: false,
  togglePrivacy: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    setIsPrivate(localStorage.getItem("privacy-mode") === "true");
  }, []);

  function togglePrivacy() {
    setIsPrivate((prev) => {
      localStorage.setItem("privacy-mode", String(!prev));
      return !prev;
    });
  }

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
```

- [ ] **Step 2: Add PrivacyProvider to app layout**

Open `app/(app)/layout.tsx`. Wrap children with `<PrivacyProvider>` alongside the existing providers.

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add lib/context/privacy-context.tsx app/(app)/layout.tsx
git commit -m "feat: add privacy mode context with localStorage persistence"
```

---

## Task 3: Dashboard Utility Functions

**Files:**
- Create: `lib/utils/dashboard.ts`

All functions are pure (no DB calls) — inputs are already-fetched arrays.

- [ ] **Step 1: Write `getRangeInterval`**

```typescript
// lib/utils/dashboard.ts
import type { Account, Transaction, Category } from "@/lib/types/database.types";
import { convertCurrency } from "@/lib/utils";

export type RangeKey = "7D" | "30D" | "90D" | "1Y";
export type Granularity = "day" | "week" | "month";

export interface RangeInterval {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  granularity: Granularity;
}

export function getRangeInterval(range: RangeKey): RangeInterval {
  const today = new Date();
  const dateTo = today.toISOString().split("T")[0];
  const start = new Date(today);
  const days = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const;
  start.setDate(start.getDate() - days[range]);
  const dateFrom = start.toISOString().split("T")[0];
  const granularity: Granularity =
    range === "1Y" ? "month" : range === "90D" ? "week" : "day";
  return { dateFrom, dateTo, granularity };
}
```

- [ ] **Step 2: Write `buildNetWorthSeries`**

```typescript
export interface NetWorthPoint {
  date: string; // display label
  total: number;
  [accountId: string]: number | string;
}

// Generates the ISO dates between start and end (inclusive)
function isoDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function periodKey(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr + "T00:00:00");
  if (granularity === "month") {
    return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  }
  if (granularity === "week") {
    // Use Monday of the week as key
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday.toISOString().split("T")[0];
  }
  return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
}

export function buildNetWorthSeries(
  accounts: Account[],
  transactions: Transaction[],
  dateFrom: string,
  dateTo: string,
  granularity: Granularity,
  rates: Record<string, number>,
  displayCurrency: string
): NetWorthPoint[] {
  // Group balance_delta by account + date
  const deltaMap: Record<string, Record<string, number>> = {};
  for (const txn of transactions) {
    if (!deltaMap[txn.account_id]) deltaMap[txn.account_id] = {};
    deltaMap[txn.account_id][txn.date] =
      (deltaMap[txn.account_id][txn.date] ?? 0) + (txn.balance_delta ?? 0);
  }

  // Starting balance per account = currentBalance - sum(all deltas in range)
  const runningBalance: Record<string, number> = {};
  for (const acc of accounts) {
    const sumInRange = Object.values(deltaMap[acc.id] ?? {}).reduce((s, d) => s + d, 0);
    runningBalance[acc.id] = acc.balance - sumInRange;
  }

  // Walk forward day by day, group into periods
  const allDays = isoDatesBetween(dateFrom, dateTo);
  const periodMap: Record<string, NetWorthPoint> = {};

  for (const day of allDays) {
    for (const acc of accounts) {
      runningBalance[acc.id] += deltaMap[acc.id]?.[day] ?? 0;
    }

    const key = periodKey(day, granularity);
    if (!periodMap[key]) periodMap[key] = { date: key, total: 0 };

    let total = 0;
    for (const acc of accounts) {
      const inDisplay = convertCurrency(runningBalance[acc.id], acc.currency, displayCurrency, rates);
      periodMap[key][acc.id] = inDisplay;
      total += inDisplay;
    }
    periodMap[key].total = total;
  }

  return Object.values(periodMap);
}
```

- [ ] **Step 3: Write `buildIncomeExpenseSeries`**

```typescript
export interface IncomeExpensePoint {
  period: string;
  income: number;
  expenses: number;
}

export function buildIncomeExpenseSeries(
  transactions: Transaction[],
  dateFrom: string,
  dateTo: string,
  granularity: Granularity,
  rates: Record<string, number>,
  displayCurrency: string
): IncomeExpensePoint[] {
  const map: Record<string, { income: number; expenses: number }> = {};

  for (const txn of transactions) {
    if (txn.type === "transfer") continue;
    const key = periodKey(txn.date, granularity);
    if (!map[key]) map[key] = { income: 0, expenses: 0 };

    const amountUsd = txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1);
    const inDisplay = amountUsd * (rates[displayCurrency] ?? 1);

    if (txn.type === "income") map[key].income += inDisplay;
    else map[key].expenses += inDisplay;
  }

  // Fill gaps with 0 and preserve chronological order
  const allDays = isoDatesBetween(dateFrom, dateTo);
  const seenKeys = new Set<string>();
  for (const day of allDays) {
    const key = periodKey(day, granularity);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
    }
  }

  return [...seenKeys].map((key) => ({ period: key, ...map[key] }));
}
```

- [ ] **Step 4: Write `buildCategoryBreakdown`**

```typescript
export interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  rates: Record<string, number>,
  displayCurrency: string
): CategoryPoint[] {
  const map: Record<string, number> = {};

  for (const txn of transactions) {
    if (txn.type !== "expense") continue;
    const key = txn.category_id ?? "uncategorized";
    const amountUsd = txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1);
    const inDisplay = amountUsd * (rates[displayCurrency] ?? 1);
    map[key] = (map[key] ?? 0) + inDisplay;
  }

  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  return Object.entries(map)
    .map(([id, value]) => ({
      name: catById[id]?.name ?? "Uncategorized",
      value,
      color: catById[id]?.color ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);
}
```

- [ ] **Step 5: Write `computeSavingsRate`**

```typescript
export function computeSavingsRate(
  totalIncomeDisplay: number,
  totalExpensesDisplay: number
): number {
  if (totalIncomeDisplay <= 0) return 0;
  return Math.max(0, Math.min(100,
    ((totalIncomeDisplay - totalExpensesDisplay) / totalIncomeDisplay) * 100
  ));
}
```

- [ ] **Step 6: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**
```bash
git add lib/utils/dashboard.ts
git commit -m "feat: add dashboard data utility functions"
```

---

## Task 4: Dashboard Hooks

**Files:**
- Create: `lib/hooks/use-dashboard.ts`

- [ ] **Step 1: Write the hooks**

```typescript
// lib/hooks/use-dashboard.ts
"use client";

import { useMemo } from "react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rate";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import {
  getRangeInterval,
  buildNetWorthSeries,
  buildIncomeExpenseSeries,
  buildCategoryBreakdown,
  computeSavingsRate,
  type RangeKey,
} from "@/lib/utils/dashboard";
import { convertCurrency } from "@/lib/utils";

export function usePeriodSummary(range: RangeKey) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => {
        const usd = t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1);
        return s + usd * (rates[displayCurrency] ?? 1);
      }, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => {
        const usd = t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1);
        return s + usd * (rates[displayCurrency] ?? 1);
      }, 0);

    const savingsRate = computeSavingsRate(income, expenses);

    const incomeExpense = buildIncomeExpenseSeries(
      transactions, dateFrom, dateTo, granularity, rates, displayCurrency
    );

    const categoryBreakdown = buildCategoryBreakdown(
      transactions, categories, rates, displayCurrency
    );

    return { income, expenses, savingsRate, incomeExpense, categoryBreakdown };
  }, [transactions, categories, rates, displayCurrency, dateFrom, dateTo, granularity]);
}

export function useNetWorthSeries(range: RangeKey) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });
  const { data: accounts = [] } = useAccounts();

  return useMemo(() =>
    buildNetWorthSeries(accounts, transactions, dateFrom, dateTo, granularity, rates, displayCurrency),
    [accounts, transactions, dateFrom, dateTo, granularity, rates, displayCurrency]
  );
}

export function useTotalNetWorth() {
  const { data: accounts = [] } = useAccounts();
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();

  return useMemo(() =>
    accounts.reduce((sum, acc) =>
      sum + convertCurrency(acc.balance, acc.currency, displayCurrency, rates), 0),
    [accounts, rates, displayCurrency]
  );
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add lib/hooks/use-dashboard.ts
git commit -m "feat: add dashboard data hooks"
```

---

## Task 5: Range Selector + KPI Strip

**Files:**
- Create: `components/dashboard/range-selector.tsx`
- Create: `components/dashboard/kpi-strip.tsx`

- [ ] **Step 1: Range selector**

```tsx
// components/dashboard/range-selector.tsx
"use client";

import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

const RANGES: RangeKey[] = ["7D", "30D", "90D", "1Y"];

interface RangeSelectorProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
  className?: string;
}

export function RangeSelector({ value, onChange, className }: RangeSelectorProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            value === r
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: KPI strip**

```tsx
// components/dashboard/kpi-strip.tsx
"use client";

import { TrendingUp, TrendingDown, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";
import { cn } from "@/lib/utils";

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
```

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add components/dashboard/range-selector.tsx components/dashboard/kpi-strip.tsx
git commit -m "feat: add range selector and KPI strip dashboard components"
```

---

## Task 6: Net Worth Area Chart

**Files:**
- Create: `components/dashboard/net-worth-chart.tsx`

Note: Recharts `AreaChart` + `ResponsiveContainer` requires a numeric key for stacking. Account IDs serve as data keys.

- [ ] **Step 1: Write the component**

```tsx
// components/dashboard/net-worth-chart.tsx
"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { useNetWorthSeries } from "@/lib/hooks/use-dashboard";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316",
];

export function NetWorthChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const data = useNetWorthSeries(range);
  const { data: accounts = [] } = useAccounts();
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Net Worth</h3>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="date"
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
            formatter={(value: number, name: string) => {
              const acc = accounts.find((a) => a.id === name);
              return [
                isPrivate ? "••••" : formatCurrency(value, displayCurrency),
                acc?.name ?? name,
              ];
            }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
          />
          {accounts.map((acc, i) => (
            <Area
              key={acc.id}
              type="monotone"
              dataKey={acc.id}
              name={acc.id}
              stackId="1"
              stroke={acc.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              fill={acc.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add components/dashboard/net-worth-chart.tsx
git commit -m "feat: add net worth area chart dashboard component"
```

---

## Task 7: Income vs Expenses Bar Chart

**Files:**
- Create: `components/dashboard/income-expense-chart.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/dashboard/income-expense-chart.tsx
"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function IncomeExpenseChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const { incomeExpense } = usePeriodSummary(range);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Income vs Expenses</h3>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={incomeExpense} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            tickFormatter={(v) => isPrivate ? "••••" : formatCurrency(v, displayCurrency)}
            width={70}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              isPrivate ? "••••" : formatCurrency(value, displayCurrency),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
          />
          <Legend
            formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add components/dashboard/income-expense-chart.tsx
git commit -m "feat: add income vs expenses bar chart dashboard component"
```

---

## Task 8: Category Donut Chart

**Files:**
- Create: `components/dashboard/category-donut-chart.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/dashboard/category-donut-chart.tsx
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { usePeriodSummary } from "@/lib/hooks/use-dashboard";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { formatCurrency } from "@/lib/utils";
import type { RangeKey } from "@/lib/utils/dashboard";

export function CategoryDonutChart() {
  const [range, setRange] = useState<RangeKey>("30D");
  const { categoryBreakdown } = usePeriodSummary(range);
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();

  const isEmpty = categoryBreakdown.length === 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Spending by Category</h3>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {isEmpty ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          No expenses in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={categoryBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {categoryBreakdown.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                isPrivate ? "••••" : formatCurrency(value, displayCurrency),
              ]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add components/dashboard/category-donut-chart.tsx
git commit -m "feat: add category donut chart dashboard component"
```

---

## Task 9: Dashboard Page Assembly

**Files:**
- Modify: `app/(app)/page.tsx`

Replace the current placeholder with the full dashboard.

- [ ] **Step 1: Write the full dashboard page**

```tsx
// app/(app)/page.tsx
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
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
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
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Run dev server and manually verify**
```bash
npm run dev
```
Navigate to `http://localhost:3000` and confirm:
- Net worth shows total across all accounts in selected currency
- Privacy toggle hides/shows all figures (persists on reload)
- Currency selector switches all amounts (persists on reload)
- Account cards display in a scrollable row (mobile) / grid (desktop)
- KPI strip shows income/expenses/savings rate for selected range
- All 3 charts render with data (net worth trend, income/expenses bar, category donut)
- Each chart's range selector works independently
- Empty state shown in category donut when no expenses

- [ ] **Step 4: Commit**
```bash
git add app/(app)/page.tsx
git commit -m "feat: assemble full dashboard page with charts and KPI strip"
```

---

## Task 10: Unit Tests for Dashboard Utilities

**Files:**
- Create: `__tests__/lib/utils/dashboard.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// __tests__/lib/utils/dashboard.test.ts
import { describe, it, expect } from "vitest";
import {
  getRangeInterval,
  buildCategoryBreakdown,
  buildIncomeExpenseSeries,
  computeSavingsRate,
  buildNetWorthSeries,
} from "@/lib/utils/dashboard";
import type { Transaction, Category, Account } from "@/lib/types/database.types";

const rates = { USD: 1, IDR: 16000 };

const makeTxn = (overrides: Partial<Transaction>): Transaction => ({
  id: "t1", user_id: "u1", account_id: "a1", type: "expense",
  amount: 100, balance_delta: -100, currency: "USD",
  converted_amount_usd: 100, category_id: null, notes: null,
  date: "2026-04-01", recurring_id: null, transfer_pair_id: null,
  is_opening_balance: false, created_at: "",
  ...overrides,
});

describe("getRangeInterval", () => {
  it("returns granularity=day for 7D and 30D", () => {
    expect(getRangeInterval("7D").granularity).toBe("day");
    expect(getRangeInterval("30D").granularity).toBe("day");
  });

  it("returns granularity=week for 90D", () => {
    expect(getRangeInterval("90D").granularity).toBe("week");
  });

  it("returns granularity=month for 1Y", () => {
    expect(getRangeInterval("1Y").granularity).toBe("month");
  });

  it("dateFrom is before dateTo", () => {
    const { dateFrom, dateTo } = getRangeInterval("30D");
    expect(dateFrom < dateTo).toBe(true);
  });
});

describe("computeSavingsRate", () => {
  it("computes savings rate correctly", () => {
    expect(computeSavingsRate(1000, 600)).toBeCloseTo(40);
  });

  it("returns 0 when income is 0", () => {
    expect(computeSavingsRate(0, 0)).toBe(0);
  });

  it("clamps to 0 when expenses exceed income", () => {
    expect(computeSavingsRate(100, 200)).toBe(0);
  });

  it("returns 100 when expenses are 0", () => {
    expect(computeSavingsRate(1000, 0)).toBe(100);
  });
});

describe("buildCategoryBreakdown", () => {
  const categories: Category[] = [
    { id: "cat1", user_id: null, name: "Food", type: "expense", icon: "", color: "#f00", parent_id: null, is_system: true, created_at: "" },
  ];

  it("sums expenses by category", () => {
    const txns = [
      makeTxn({ id: "t1", category_id: "cat1", amount: 100, converted_amount_usd: 100 }),
      makeTxn({ id: "t2", category_id: "cat1", amount: 50, converted_amount_usd: 50 }),
    ];
    const result = buildCategoryBreakdown(txns, categories, rates, "USD");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Food");
    expect(result[0].value).toBeCloseTo(150);
  });

  it("excludes income and transfer transactions", () => {
    const txns = [
      makeTxn({ id: "t1", type: "income", balance_delta: 500, converted_amount_usd: 500 }),
      makeTxn({ id: "t2", type: "transfer", transfer_pair_id: "p1" }),
    ];
    expect(buildCategoryBreakdown(txns, categories, rates, "USD")).toHaveLength(0);
  });

  it("converts to display currency via USD", () => {
    const txns = [makeTxn({ converted_amount_usd: 10 })];
    const result = buildCategoryBreakdown(txns, [], rates, "IDR");
    // 10 USD * 16000 = 160000 IDR
    expect(result[0].value).toBeCloseTo(160000);
  });
});

describe("buildIncomeExpenseSeries", () => {
  it("groups income and expense by day", () => {
    const txns = [
      makeTxn({ id: "t1", type: "income", balance_delta: 100, converted_amount_usd: 100 }),
      makeTxn({ id: "t2", type: "expense", amount: 40, balance_delta: -40, converted_amount_usd: 40 }),
    ];
    const result = buildIncomeExpenseSeries(txns, "2026-04-01", "2026-04-01", "day", rates, "USD");
    const day = result.find((p) => p.income > 0 || p.expenses > 0);
    expect(day?.income).toBeCloseTo(100);
    expect(day?.expenses).toBeCloseTo(40);
  });

  it("excludes transfer transactions", () => {
    const txns = [makeTxn({ type: "transfer", transfer_pair_id: "p1" })];
    const result = buildIncomeExpenseSeries(txns, "2026-04-01", "2026-04-01", "day", rates, "USD");
    expect(result.every((p) => p.income === 0 && p.expenses === 0)).toBe(true);
  });
});

describe("buildNetWorthSeries", () => {
  const accounts: Account[] = [
    { id: "a1", user_id: "u1", name: "BCA", type: "checking", currency: "USD", balance: 1000, color: "#3b82f6", icon: "wallet", is_archived: false, created_at: "" },
  ];

  it("last point total matches current balance when all txns are in range", () => {
    const today = new Date().toISOString().split("T")[0];
    // account.balance = 1000, one income of 200 today
    const txns = [makeTxn({ account_id: "a1", type: "income", balance_delta: 200, converted_amount_usd: 200, date: today })];
    const result = buildNetWorthSeries(accounts, txns, today, today, "day", rates, "USD");
    expect(result.at(-1)?.total).toBeCloseTo(1000);
  });

  it("returns empty array when no accounts", () => {
    const result = buildNetWorthSeries([], [], "2026-04-01", "2026-04-01", "day", rates, "USD");
    // One point with total=0
    expect(result.every((p) => p.total === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run all tests**
```bash
npm test
```
Expected: all existing tests pass + new dashboard utility tests pass.

- [ ] **Step 3: Commit**
```bash
git add __tests__/lib/utils/dashboard.test.ts
git commit -m "test: add unit tests for dashboard utility functions"
```

---

## Verification Checklist

```bash
npm test           # all tests pass
npx tsc --noEmit   # no TypeScript errors
npm run dev        # open http://localhost:3000
```

**Manual checks:**
- [ ] Net worth displays correctly in IDR and USD
- [ ] Privacy toggle hides all numbers with `••••` and persists on reload
- [ ] Currency selector changes persist on page reload
- [ ] KPI strip range selector updates income/expenses/savings rate
- [ ] Net worth chart renders stacked area, one area per account
- [ ] Income/expense chart: grouped bars, transfers excluded
- [ ] Category donut renders with category colors; shows empty state when no expenses
- [ ] Each chart's range selector works independently
- [ ] Dashboard usable on mobile (horizontal account card scroll, charts stack vertically)
- [ ] Dark mode renders correctly (tooltips, grid lines, text)
