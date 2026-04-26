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
