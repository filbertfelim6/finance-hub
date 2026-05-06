"use client";

import { useState } from "react";
import { TransactionItem } from "./transaction-item";
import {
  TransactionFilters,
  type TransactionFiltersState,
} from "./transaction-filters";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useCategories } from "@/lib/hooks/use-categories";
import type { Transaction } from "@/lib/types/database.types";
import type { GetTransactionsOptions } from "@/lib/queries/transactions";

interface TransactionListProps {
  baseOptions?: GetTransactionsOptions;
  showFilters?: boolean;
}

const DEFAULT_FILTERS: TransactionFiltersState = {
  types: [],
  categoryIds: [],
  dateFrom: "",
  dateTo: "",
  search: "",
};

function formatDateLabel(dateStr: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function TransactionList({
  baseOptions = {},
  showFilters = true,
}: TransactionListProps) {
  const [filters, setFilters] = useState<TransactionFiltersState>(DEFAULT_FILTERS);

  const queryOptions: GetTransactionsOptions = {
    ...baseOptions,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const { data: transactions = [], isLoading } = useTransactions(queryOptions);
  const { data: categories = [] } = useCategories();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = transactions.filter((t) => {
    if (filters.search && !t.notes?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.types.length > 0 && !filters.types.includes(t.type)) return false;
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(t.category_id ?? "")) return false;
    return true;
  });

  // Group by date, preserving the sorted order from the query
  const groups: { date: string; transactions: Transaction[] }[] = [];
  for (const txn of filtered) {
    const last = groups[groups.length - 1];
    if (last && last.date === txn.date) {
      last.transactions.push(txn);
    } else {
      groups.push({ date: txn.date, transactions: [txn] });
    }
  }

  return (
    <div className="space-y-1">
      {showFilters && (
        <div className="mb-5">
          <TransactionFilters filters={filters} onChange={setFilters} categories={categories} />
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((g) => (
            <div key={g} className="space-y-1">
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="rounded-xl border overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted/50 animate-pulse border-b last:border-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <div className="space-y-5">
          {groups.map(({ date, transactions: txns }) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {formatDateLabel(date)}
              </p>
              <div className="rounded-xl border bg-card overflow-hidden">
                {txns.map((txn, i) => (
                  <div
                    key={txn.id}
                    className={i < txns.length - 1 ? "border-b px-4" : "px-4"}
                  >
                    <TransactionItem
                      transaction={txn}
                      category={txn.category_id ? categoryMap[txn.category_id] : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
