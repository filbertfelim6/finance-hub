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
