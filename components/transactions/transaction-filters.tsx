"use client";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { TransactionType } from "@/lib/types/database.types";

export interface TransactionFiltersState {
  type: TransactionType | "all";
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  function update(patch: Partial<TransactionFiltersState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search notes…"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="h-8 w-40 text-sm"
      />
      <Select
        value={filters.type}
        onValueChange={(v) => update({ type: v as TransactionType | "all" })}
      >
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => update({ dateFrom: e.target.value })}
        className="h-8 w-36 text-sm"
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => update({ dateTo: e.target.value })}
        className="h-8 w-36 text-sm"
        aria-label="To date"
      />
    </div>
  );
}
