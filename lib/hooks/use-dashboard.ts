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
  buildNetWorthFlowSeries,
  buildIncomeExpenseSeries,
  buildCategoryBreakdown,
  computeSavingsRate,
  buildSavingsRateSeries,
  buildCategoryTrendSeries,
  buildCashFlowWaterfall,
  buildBudgetProgress,
  type RangeKey,
} from "@/lib/utils/dashboard";
import { useBudgets } from "@/lib/hooks/use-budgets";
import { convertCurrency } from "@/lib/utils";

export function usePeriodSummary(
  range: RangeKey,
  customFrom?: string,
  customTo?: string,
  accountIds?: string[]
) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range, customFrom, customTo);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [], isLoading: txLoading, isFetching: txFetching } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [], isLoading: catLoading } = useCategories();

  const result = useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;

    const income = txns
      .filter((t) => t.type === "income")
      .reduce((s, t) => {
        const inDisplay = t.currency === displayCurrency
          ? t.amount
          : (t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1)) * (rates[displayCurrency] ?? 1);
        return s + inDisplay;
      }, 0);

    const expenses = txns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => {
        const inDisplay = t.currency === displayCurrency
          ? t.amount
          : (t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1)) * (rates[displayCurrency] ?? 1);
        return s + inDisplay;
      }, 0);

    const savingsRate = computeSavingsRate(income, expenses);
    const incomeExpense = buildIncomeExpenseSeries(txns, dateFrom, dateTo, granularity, rates, displayCurrency);
    const categoryBreakdown = buildCategoryBreakdown(txns, categories, rates, displayCurrency);

    return { income, expenses, savingsRate, incomeExpense, categoryBreakdown };
  }, [transactions, categories, rates, displayCurrency, dateFrom, dateTo, granularity, accountIds]);

  return { ...result, isLoading: txLoading || catLoading, isFetching: txFetching || catLoading };
}

export function useNetWorthSeries(
  range: RangeKey,
  customFrom?: string,
  customTo?: string,
  accountIds?: string[]
) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range, customFrom, customTo);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [], isLoading: txLoading, isFetching: txFetching } = useTransactions({ dateFrom, dateTo });
  const { data: accounts = [], isLoading: accLoading } = useAccounts();

  const data = useMemo(() => {
    const filteredAccounts = accountIds ? accounts.filter((a) => accountIds.includes(a.id)) : accounts;
    const filteredTxns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildNetWorthSeries(filteredAccounts, filteredTxns, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [accounts, transactions, dateFrom, dateTo, granularity, rates, displayCurrency, accountIds]);

  return { data, isLoading: txLoading || accLoading, isFetching: txFetching || accLoading };
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

export function useSavingsRateSeries(
  range: RangeKey = "1Y",
  customFrom?: string,
  customTo?: string,
  accountIds?: string[]
) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range, customFrom, customTo);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [], isLoading, isFetching } = useTransactions({ dateFrom, dateTo });

  const data = useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildSavingsRateSeries(txns, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [transactions, rates, displayCurrency, dateFrom, dateTo, granularity, accountIds]);

  return { data, isLoading, isFetching };
}

export function useCategoryTrendSeries(
  range: RangeKey,
  customFrom?: string,
  customTo?: string,
  accountIds?: string[]
) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range, customFrom, customTo);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [], isLoading: txLoading, isFetching: txFetching } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [], isLoading: catLoading } = useCategories();

  const result = useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildCategoryTrendSeries(txns, categories, 5, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [transactions, categories, rates, displayCurrency, dateFrom, dateTo, granularity, accountIds]);

  return { ...result, isLoading: txLoading || catLoading, isFetching: txFetching || catLoading };
}

export function useNetWorthFlowSeries(
  range: RangeKey,
  accountIds?: string[]
) {
  const { dateFrom, dateTo, granularity } = getRangeInterval(range);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [], isLoading: txLoading, isFetching: txFetching } = useTransactions({ dateFrom, dateTo });
  const { data: accounts = [], isLoading: accLoading } = useAccounts();

  const data = useMemo(() => {
    const filteredAccounts = accountIds ? accounts.filter((a) => accountIds.includes(a.id)) : accounts;
    const filteredTxns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildNetWorthFlowSeries(filteredAccounts, filteredTxns, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [accounts, transactions, dateFrom, dateTo, granularity, rates, displayCurrency, accountIds]);

  return { data, isLoading: txLoading || accLoading, isFetching: txFetching || accLoading };
}

export function useCashFlowWaterfall(
  range: RangeKey,
  customFrom?: string,
  customTo?: string,
  accountIds?: string[]
) {
  const { dateFrom, dateTo } = getRangeInterval(range, customFrom, customTo);
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildCashFlowWaterfall(txns, categories, rates, displayCurrency);
  }, [transactions, categories, rates, displayCurrency, dateFrom, dateTo, accountIds]);
}

export function useBudgetProgress() {
  const today = new Date();
  const dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const dateTo = today.toISOString().split("T")[0];
  const rates = useExchangeRates();
  const { displayCurrency } = useDisplayCurrency();
  const { data: transactions = [], isLoading: txLoading } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();

  const data = useMemo(
    () => buildBudgetProgress(budgets, transactions, categories, rates, displayCurrency),
    [budgets, transactions, categories, rates, displayCurrency]
  );

  return { data, isLoading: txLoading || catLoading || budgetsLoading };
}
