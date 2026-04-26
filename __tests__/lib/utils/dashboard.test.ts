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

  it("converts to display currency via USD pivot", () => {
    const txns = [makeTxn({ converted_amount_usd: 10 })];
    const result = buildCategoryBreakdown(txns, [], rates, "IDR");
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
    const txns = [makeTxn({ account_id: "a1", type: "income", balance_delta: 200, converted_amount_usd: 200, date: today })];
    const result = buildNetWorthSeries(accounts, txns, today, today, "day", rates, "USD");
    expect(result.at(-1)?.total).toBeCloseTo(1000);
  });

  it("returns one point with total=0 when no accounts", () => {
    const result = buildNetWorthSeries([], [], "2026-04-01", "2026-04-01", "day", rates, "USD");
    expect(result.every((p) => p.total === 0)).toBe(true);
  });
});
