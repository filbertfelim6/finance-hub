"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Account } from "@/lib/types/database.types";

interface AccountFilterProps {
  accounts: Account[];
  // null = all accounts selected
  selectedIds: string[] | null;
  onChange: (ids: string[] | null) => void;
}

export function AccountFilter({ accounts, selectedIds, onChange }: AccountFilterProps) {
  if (accounts.length === 0) return null;

  const allSelected = selectedIds === null || selectedIds.length === accounts.length;

  const label = allSelected
    ? "All accounts"
    : selectedIds!.length === 1
      ? (accounts.find((a) => a.id === selectedIds![0])?.name ?? "1 account")
      : `${selectedIds!.length} accounts`;

  function toggleAll() {
    onChange(null);
  }

  function toggle(id: string) {
    const current = selectedIds ?? accounts.map((a) => a.id);
    if (current.includes(id)) {
      if (current.length === 1) return; // keep at least one
      const next = current.filter((i) => i !== id);
      onChange(next.length === accounts.length ? null : next);
    } else {
      const next = [...current, id];
      onChange(next.length === accounts.length ? null : next);
    }
  }

  function isChecked(id: string) {
    return selectedIds === null || selectedIds.includes(id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-7 text-xs gap-1 font-normal"
        )}
      >
        {label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={toggleAll}>
          All accounts
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {accounts.map((acc) => (
          <DropdownMenuCheckboxItem
            key={acc.id}
            checked={isChecked(acc.id)}
            onCheckedChange={() => toggle(acc.id)}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {acc.color && (
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color }}
                />
              )}
              <span className="truncate">{acc.name}</span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
