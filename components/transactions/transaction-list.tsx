"use client";

import { useState } from "react";
import { TransactionItem } from "./transaction-item";
import {
  TransactionFilters,
  type TransactionFiltersState,
} from "./transaction-filters";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useCategories } from "@/lib/hooks/use-categories";
import type { GetTransactionsOptions } from "@/lib/queries/transactions";

interface TransactionListProps {
  baseOptions?: GetTransactionsOptions;
  showFilters?: boolean;
}

const DEFAULT_FILTERS: TransactionFiltersState = {
  type: "all",
  dateFrom: "",
  dateTo: "",
  search: "",
};

export function TransactionList({
  baseOptions = {},
  showFilters = true,
}: TransactionListProps) {
  const [filters, setFilters] = useState<TransactionFiltersState>(DEFAULT_FILTERS);

  const queryOptions: GetTransactionsOptions = {
    ...baseOptions,
    type: filters.type !== "all" ? filters.type : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const { data: transactions = [], isLoading } = useTransactions(queryOptions);
  const { data: categories = [] } = useCategories();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = filters.search
    ? transactions.filter((t) =>
        t.notes?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-3">
      {showFilters && (
        <TransactionFilters filters={filters} onChange={setFilters} />
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No transactions found.
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="divide-y divide-border">
          {filtered.map((txn) => (
            <TransactionItem
              key={txn.id}
              transaction={txn}
              category={txn.category_id ? categoryMap[txn.category_id] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
