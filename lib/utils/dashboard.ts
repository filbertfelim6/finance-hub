import type { Account, Transaction, Category } from "@/lib/types/database.types";
import { convertCurrency } from "@/lib/utils";

export type RangeKey = "7D" | "30D" | "90D" | "1Y";
export type Granularity = "day" | "week" | "month";

export interface RangeInterval {
  dateFrom: string;
  dateTo: string;
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
    return monday.toISOString().split("T")[0];
  }
  return `${d.toLocaleString("default", { month: "short", timeZone: "UTC" })} ${d.getUTCDate()}`;
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
  const deltaMap: Record<string, Record<string, number>> = {};
  for (const txn of transactions) {
    if (!deltaMap[txn.account_id]) deltaMap[txn.account_id] = {};
    deltaMap[txn.account_id][txn.date] =
      (deltaMap[txn.account_id][txn.date] ?? 0) + (txn.balance_delta ?? 0);
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

    const amountUsd = txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1);
    const inDisplay = amountUsd * (rates[displayCurrency] ?? 1);

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
    const catId = txn.category_id ?? "uncategorized";
    const amountUsd = txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1);
    const inDisplay = amountUsd * (rates[displayCurrency] ?? 1);
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

// ─── Cash Flow Waterfall ──────────────────────────────────────────────────────

export interface WaterfallPoint {
  name: string;
  base: number;
  value: number;
  fill: string;
}

export function buildCashFlowWaterfall(
  accounts: Account[],
  transactions: Transaction[],
  categories: Category[],
  dateFrom: string,
  dateTo: string,
  rates: Record<string, number>,
  displayCurrency: string,
  topN = 6
): WaterfallPoint[] {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Opening = current balance minus all deltas in period
  const deltaByAccount: Record<string, number> = {};
  for (const txn of transactions) {
    deltaByAccount[txn.account_id] = (deltaByAccount[txn.account_id] ?? 0) + (txn.balance_delta ?? 0);
  }
  let opening = 0;
  for (const acc of accounts) {
    const delta = deltaByAccount[acc.id] ?? 0;
    opening += convertCurrency(acc.balance - delta, acc.currency, displayCurrency, rates);
  }

  let totalIncome = 0;
  const catExpenses: Record<string, number> = {};
  for (const txn of transactions) {
    if (txn.type === "transfer") continue;
    const amountUsd = txn.converted_amount_usd ?? txn.amount / (rates[txn.currency] ?? 1);
    const inDisplay = amountUsd * (rates[displayCurrency] ?? 1);
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
  let running = opening;

  points.push({ name: "Opening", base: 0, value: opening, fill: "#3b82f6" });

  if (totalIncome > 0) {
    points.push({ name: "Income", base: running, value: totalIncome, fill: "#10b981" });
    running += totalIncome;
  }

  for (const [catId, amount] of topCats) {
    running -= amount;
    points.push({
      name: catById[catId]?.name ?? "Uncategorized",
      base: running,
      value: amount,
      fill: catById[catId]?.color ?? "#ef4444",
    });
  }

  if (otherExpense > 0) {
    running -= otherExpense;
    points.push({ name: "Other", base: running, value: otherExpense, fill: "#94a3b8" });
  }

  points.push({ name: "Closing", base: 0, value: running, fill: "#6366f1" });

  return points;
}
