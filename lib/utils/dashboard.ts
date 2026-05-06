import type { Account, Transaction, Category, Budget } from "@/lib/types/database.types";
import { convertCurrency } from "@/lib/utils";

export type RangeKey = "7D" | "30D" | "90D" | "3M" | "6M" | "1Y" | "custom";
export type Granularity = "day" | "week" | "month";

export interface RangeInterval {
  dateFrom: string;
  dateTo: string;
  granularity: Granularity;
}

export function getRangeInterval(range: RangeKey, customFrom?: string, customTo?: string): RangeInterval {
  if (range === "custom" && customFrom && customTo) {
    const diffMs = new Date(customTo + "T00:00:00Z").getTime() - new Date(customFrom + "T00:00:00Z").getTime();
    const days = Math.round(diffMs / 86400000);
    const granularity: Granularity = days > 90 ? "month" : days > 30 ? "week" : "day";
    return { dateFrom: customFrom, dateTo: customTo, granularity };
  }
  const today = new Date();
  const dateTo = today.toISOString().split("T")[0];

  if (range === "3M" || range === "6M" || range === "1Y") {
    const months = range === "3M" ? 3 : range === "6M" ? 6 : 12;
    const start = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
    const dateFrom = start.toISOString().split("T")[0];
    return { dateFrom, dateTo, granularity: "month" };
  }

  const start = new Date(today);
  const presetDays = { "7D": 7, "30D": 30, "90D": 90, "custom": 30 } as const;
  start.setDate(start.getDate() - presetDays[range as keyof typeof presetDays]);
  const dateFrom = start.toISOString().split("T")[0];
  const granularity: Granularity = range === "90D" ? "week" : "day";
  return { dateFrom, dateTo, granularity };
}

export interface NetWorthPoint {
  date: string;
  total: number;
  [accountId: string]: number | string;
}

function isoDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function periodKey(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr + "T00:00:00Z");
  if (granularity === "month") {
    return `${d.toLocaleString("default", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`;
  }
  if (granularity === "week") {
    const day = d.getUTCDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diff);
    return `${monday.toLocaleString("default", { month: "short", timeZone: "UTC" })} ${monday.getUTCDate()}`;
  }
  return `${d.toLocaleString("default", { month: "short", timeZone: "UTC" })} ${d.getUTCDate()}`;
}

// Infers balance_delta for transactions that pre-date the balance_delta column.
// Transfer direction is determined from notes format "SourceName → DestName".
function effectiveDelta(
  txn: Transaction,
  accountById: Record<string, Account>,
  rates: Record<string, number>
): number {
  if (txn.balance_delta !== null) return txn.balance_delta;
  const acc = accountById[txn.account_id];
  if (!acc) return 0;
  const inAccCurrency = convertCurrency(txn.amount, txn.currency, acc.currency, rates);
  if (txn.type === "income") return inAccCurrency;
  if (txn.type === "expense") return -inAccCurrency;
  // transfer: check notes "SourceName → DestName"
  if (txn.notes) {
    const sourceName = txn.notes.split(" → ")[0]?.trim();
    if (sourceName && acc.name === sourceName) return -inAccCurrency;
  }
  return inAccCurrency; // destination
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
  const accountById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const deltaMap: Record<string, Record<string, number>> = {};
  for (const txn of transactions) {
    if (!deltaMap[txn.account_id]) deltaMap[txn.account_id] = {};
    deltaMap[txn.account_id][txn.date] =
      (deltaMap[txn.account_id][txn.date] ?? 0) + effectiveDelta(txn, accountById, rates);
  }

  const runningBalance: Record<string, number> = {};
  for (const acc of accounts) {
    const sumInRange = Object.values(deltaMap[acc.id] ?? {}).reduce((s, d) => s + d, 0);
    runningBalance[acc.id] = acc.balance - sumInRange;
  }

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

    const inDisplay = txn.currency === displayCurrency
      ? txn.amount
      : (txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1)) * (rates[displayCurrency] ?? 1);

    if (txn.type === "income") map[key].income += inDisplay;
    else map[key].expenses += inDisplay;
  }

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
    const inDisplay = txn.currency === displayCurrency
      ? txn.amount
      : (txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1)) * (rates[displayCurrency] ?? 1);
    map[key] = (map[key] ?? 0) + inDisplay;
  }

  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const byName: Record<string, { value: number; color: string }> = {};
  for (const [id, value] of Object.entries(map)) {
    const name = catById[id]?.name ?? "Uncategorized";
    const color = catById[id]?.color ?? "#94a3b8";
    if (!byName[name]) byName[name] = { value: 0, color };
    byName[name].value += value;
  }

  return Object.entries(byName)
    .map(([name, { value, color }]) => ({ name, value, color }))
    .sort((a, b) => b.value - a.value);
}

export function computeSavingsRate(
  totalIncomeDisplay: number,
  totalExpensesDisplay: number
): number {
  if (totalIncomeDisplay <= 0) return 0;
  return Math.max(0, Math.min(100,
    ((totalIncomeDisplay - totalExpensesDisplay) / totalIncomeDisplay) * 100
  ));
}

// ─── Savings Rate Trend ───────────────────────────────────────────────────────

export interface SavingsRatePoint {
  period: string;
  rate: number;
  income: number;
  expenses: number;
}

export function buildSavingsRateSeries(
  transactions: Transaction[],
  dateFrom: string,
  dateTo: string,
  granularity: Granularity,
  rates: Record<string, number>,
  displayCurrency: string
): SavingsRatePoint[] {
  return buildIncomeExpenseSeries(transactions, dateFrom, dateTo, granularity, rates, displayCurrency)
    .map(({ period, income, expenses }) => ({
      period,
      income,
      expenses,
      rate: computeSavingsRate(income, expenses),
    }));
}

// ─── Category Spend Trend ─────────────────────────────────────────────────────

export interface CategoryTrendPoint {
  period: string;
  [categoryName: string]: number | string;
}

export interface CategoryTrendData {
  series: CategoryTrendPoint[];
  topCategories: { name: string; color: string }[];
}

export function buildCategoryTrendSeries(
  transactions: Transaction[],
  categories: Category[],
  topN: number,
  dateFrom: string,
  dateTo: string,
  granularity: Granularity,
  rates: Record<string, number>,
  displayCurrency: string
): CategoryTrendData {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const periodCatMap: Record<string, Record<string, number>> = {};
  const catTotals: Record<string, number> = {};

  for (const txn of transactions) {
    if (txn.type !== "expense") continue;
    const key = periodKey(txn.date, granularity);
    // Normalize deleted/missing category IDs to a single "uncategorized" bucket
    const catId = txn.category_id && catById[txn.category_id] ? txn.category_id : "uncategorized";
    const inDisplay = txn.currency === displayCurrency
      ? txn.amount
      : (txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1)) * (rates[displayCurrency] ?? 1);
    if (!periodCatMap[key]) periodCatMap[key] = {};
    periodCatMap[key][catId] = (periodCatMap[key][catId] ?? 0) + inDisplay;
    catTotals[catId] = (catTotals[catId] ?? 0) + inDisplay;
  }

  const topCatIds = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => id);

  const topCategories = topCatIds.map((id) => ({
    name: catById[id]?.name ?? "Uncategorized",
    color: catById[id]?.color ?? "#94a3b8",
  }));

  const allDays = isoDatesBetween(dateFrom, dateTo);
  const seenKeys = new Set<string>();
  for (const day of allDays) {
    const key = periodKey(day, granularity);
    if (!seenKeys.has(key)) seenKeys.add(key);
  }

  const series: CategoryTrendPoint[] = [...seenKeys].map((key) => {
    const point: CategoryTrendPoint = { period: key };
    for (const id of topCatIds) {
      const catName = catById[id]?.name ?? "Uncategorized";
      point[catName] = periodCatMap[key]?.[id] ?? 0;
    }
    return point;
  });

  return { series, topCategories };
}

// ─── Net Worth Flow (monthly net worth + change) ─────────────────────────────

export interface NetWorthFlowPoint {
  period: string;
  netWorth: number;
  cashFlow: number;
}

export function buildNetWorthFlowSeries(
  accounts: Account[],
  transactions: Transaction[],
  dateFrom: string,
  dateTo: string,
  granularity: Granularity,
  rates: Record<string, number>,
  displayCurrency: string
): NetWorthFlowPoint[] {
  const accountById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const deltaMap: Record<string, Record<string, number>> = {};
  for (const txn of transactions) {
    if (!deltaMap[txn.account_id]) deltaMap[txn.account_id] = {};
    deltaMap[txn.account_id][txn.date] =
      (deltaMap[txn.account_id][txn.date] ?? 0) + effectiveDelta(txn, accountById, rates);
  }

  const runningBalance: Record<string, number> = {};
  let startingTotal = 0;
  for (const acc of accounts) {
    const sumInRange = Object.values(deltaMap[acc.id] ?? {}).reduce((s, d) => s + d, 0);
    runningBalance[acc.id] = acc.balance - sumInRange;
    startingTotal += convertCurrency(runningBalance[acc.id], acc.currency, displayCurrency, rates);
  }

  const allDays = isoDatesBetween(dateFrom, dateTo);
  const periodMap: Record<string, number> = {};

  for (const day of allDays) {
    for (const acc of accounts) {
      runningBalance[acc.id] += deltaMap[acc.id]?.[day] ?? 0;
    }
    const key = periodKey(day, granularity);
    let total = 0;
    for (const acc of accounts) {
      total += convertCurrency(runningBalance[acc.id], acc.currency, displayCurrency, rates);
    }
    periodMap[key] = total;
  }

  const periods = Object.keys(periodMap);
  return periods.map((period, i) => {
    const netWorth = periodMap[period];
    const prev = i === 0 ? startingTotal : periodMap[periods[i - 1]];
    return { period, netWorth, cashFlow: netWorth - prev };
  });
}

// ─── Cash Flow Waterfall ──────────────────────────────────────────────────────

export interface WaterfallPoint {
  name: string;
  base: number;
  value: number;
  fill: string;
}

// Builds a period-only cash flow waterfall (no opening/closing balance).
// Income is the full bar; expense categories eat downward; "Saved" closes the gap.
export function buildCashFlowWaterfall(
  transactions: Transaction[],
  categories: Category[],
  rates: Record<string, number>,
  displayCurrency: string,
  topN = 6
): WaterfallPoint[] {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  let totalIncome = 0;
  const catExpenses: Record<string, number> = {};
  for (const txn of transactions) {
    if (txn.type === "transfer") continue;
    const inDisplay = txn.currency === displayCurrency
      ? txn.amount
      : (txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1)) * (rates[displayCurrency] ?? 1);
    if (txn.type === "income") {
      totalIncome += inDisplay;
    } else {
      const catId = txn.category_id ?? "uncategorized";
      catExpenses[catId] = (catExpenses[catId] ?? 0) + inDisplay;
    }
  }

  const sortedCats = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, topN);
  const otherExpense = sortedCats.slice(topN).reduce((s, [, v]) => s + v, 0);

  const points: WaterfallPoint[] = [];
  let running = totalIncome;

  points.push({ name: "Income", base: 0, value: totalIncome, fill: "#6b8e4e" });

  for (const [catId, amount] of topCats) {
    running -= amount;
    points.push({
      name: catById[catId]?.name ?? "Uncategorized",
      base: Math.max(0, running),
      value: amount,
      fill: catById[catId]?.color ?? "#b8615a",
    });
  }

  if (otherExpense > 0) {
    running -= otherExpense;
    points.push({ name: "Other", base: Math.max(0, running), value: otherExpense, fill: "#8d9181" });
  }

  // Close the gap from 0 up to where expenses stopped
  const saved = Math.max(0, running);
  if (saved > 0) {
    points.push({ name: "Saved", base: 0, value: saved, fill: "#5a7a4e" });
  }

  return points;
}

// ─── Budget Progress ──────────────────────────────────────────────────────────

export interface BudgetProgressPoint {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budgetAmount: number;
  spent: number;
  pct: number;
  period: "monthly" | "weekly";
}

export function buildBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  rates: Record<string, number>,
  displayCurrency: string
): BudgetProgressPoint[] {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Current month boundaries
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Current week boundaries (Mon–Sun)
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  return budgets.map((budget) => {
    const cat = budget.category_id ? catById[budget.category_id] : null;
    const start = budget.period === "monthly" ? monthStart : weekStartStr;

    const spent = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category_id === budget.category_id &&
          t.date >= start &&
          t.date <= todayStr
      )
      .reduce((s, t) => {
        const inDisplay =
          t.currency === displayCurrency
            ? t.amount
            : (t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1)) *
              (rates[displayCurrency] ?? 1);
        return s + inDisplay;
      }, 0);

    const budgetAmount = convertCurrency(
      budget.amount,
      budget.currency,
      displayCurrency,
      rates
    );

    const pct = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    return {
      budgetId: budget.id,
      categoryId: budget.category_id ?? "",
      categoryName: cat?.name ?? "Uncategorized",
      categoryColor: cat?.color ?? "#94a3b8",
      categoryIcon: cat?.icon ?? "tag",
      budgetAmount,
      spent,
      pct,
      period: budget.period,
    };
  });
}
