"use client";

import { Search, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Category, TransactionType } from "@/lib/types/database.types";

export interface TransactionFiltersState {
  types: TransactionType[];
  categoryIds: string[];
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
  categories?: Category[];
}

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

const hasActiveFilters = (f: TransactionFiltersState) =>
  f.types.length > 0 || f.categoryIds.length > 0 || f.dateFrom || f.dateTo || f.search;

export function TransactionFilters({
  filters,
  onChange,
  categories = [],
}: TransactionFiltersProps) {
  function update(patch: Partial<TransactionFiltersState>) {
    onChange({ ...filters, ...patch });
  }

  function clearAll() {
    onChange({ types: [], categoryIds: [], dateFrom: "", dateTo: "", search: "" });
  }

  function toggleType(type: TransactionType, checked: boolean) {
    update({ types: checked ? [...filters.types, type] : filters.types.filter((t) => t !== type) });
  }

  function toggleCategory(id: string, checked: boolean) {
    update({ categoryIds: checked ? [...filters.categoryIds, id] : filters.categoryIds.filter((c) => c !== id) });
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const typeCount = filters.types.length;
  const catCount = filters.categoryIds.length;
  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search notes…"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: typeCount > 0 ? "secondary" : "outline", size: "sm" }),
                  "h-8 text-xs gap-1"
                )}
              >
                {typeCount > 0 ? `Type · ${typeCount}` : "Type"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            }
          />
          <DropdownMenuContent align="start">
            {TYPE_OPTIONS.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={filters.types.includes(value)}
                onCheckedChange={(checked) => toggleType(value, checked as boolean)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category */}
        {categories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: catCount > 0 ? "secondary" : "outline", size: "sm" }),
                    "h-8 text-xs gap-1"
                  )}
                >
                  {catCount > 0 ? `Category · ${catCount}` : "Category"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              }
            />
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto min-w-44">
              {expenseCategories.length > 0 && (
                <>
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold text-red-500 uppercase tracking-wide">Expense</p>
                  {expenseCategories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat.id}
                      checked={filters.categoryIds.includes(cat.id)}
                      onCheckedChange={(checked) => toggleCategory(cat.id, checked as boolean)}
                    >
                      {cat.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
              {expenseCategories.length > 0 && incomeCategories.length > 0 && <DropdownMenuSeparator />}
              {incomeCategories.length > 0 && (
                <>
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold text-green-600 uppercase tracking-wide">Income</p>
                  {incomeCategories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat.id}
                      checked={filters.categoryIds.includes(cat.id)}
                      onCheckedChange={(checked) => toggleCategory(cat.id, checked as boolean)}
                    >
                      {cat.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Date range */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            aria-label="From date"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            aria-label="To date"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Clear all */}
        {active && (
          <button
            type="button"
            onClick={clearAll}
            className="h-8 flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
