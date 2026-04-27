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
  buildSavingsRateSeries,
  buildCategoryTrendSeries,
  buildCashFlowWaterfall,
  type RangeKey,
} from "@/lib/utils/dashboard";
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
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;

    const income = txns
      .filter((t) => t.type === "income")
      .reduce((s, t) => {
        const usd = t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1);
        return s + usd * (rates[displayCurrency] ?? 1);
      }, 0);

    const expenses = txns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => {
        const usd = t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1);
        return s + usd * (rates[displayCurrency] ?? 1);
      }, 0);

    const savingsRate = computeSavingsRate(income, expenses);

    const incomeExpense = buildIncomeExpenseSeries(txns, dateFrom, dateTo, granularity, rates, displayCurrency);
    const categoryBreakdown = buildCategoryBreakdown(txns, categories, rates, displayCurrency);

    return { income, expenses, savingsRate, incomeExpense, categoryBreakdown };
  }, [transactions, categories, rates, displayCurrency, dateFrom, dateTo, granularity, accountIds]);
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
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });
  const { data: accounts = [] } = useAccounts();

  return useMemo(() => {
    const filteredAccounts = accountIds ? accounts.filter((a) => accountIds.includes(a.id)) : accounts;
    const filteredTxns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildNetWorthSeries(filteredAccounts, filteredTxns, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [accounts, transactions, dateFrom, dateTo, granularity, rates, displayCurrency, accountIds]);
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
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });

  return useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildSavingsRateSeries(txns, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [transactions, rates, displayCurrency, dateFrom, dateTo, granularity, accountIds]);
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
  const { data: transactions = [] } = useTransactions({ dateFrom, dateTo });
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    const txns = accountIds ? transactions.filter((t) => accountIds.includes(t.account_id)) : transactions;
    return buildCategoryTrendSeries(txns, categories, 5, dateFrom, dateTo, granularity, rates, displayCurrency);
  }, [transactions, categories, rates, displayCurrency, dateFrom, dateTo, granularity, accountIds]);
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
