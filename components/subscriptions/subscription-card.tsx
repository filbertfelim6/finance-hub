"use client";

import { useState } from "react";
import { Tag, Repeat, MoreHorizontal, Loader2 } from "lucide-react";
import { ICON_MAP } from "@/lib/utils/icon-map";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { usePrivacy } from "@/lib/context/privacy-context";
import { cn } from "@/lib/utils";
import type { RecurringTransaction, Category, Account } from "@/lib/types/database.types";

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className="h-4 w-4" style={{ color }} />;
}

function dueBadge(dateStr: string): { label: string; variant: "warn" | "error" | null } {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Overdue", variant: "error" };
  if (diff === 0) return { label: "Due today", variant: "warn" };
  if (diff <= 7) return { label: `Due in ${diff}d`, variant: "warn" };
  return { label: `Due ${dateStr}`, variant: null };
}

interface SubscriptionCardProps {
  subscription: RecurringTransaction;
  category: Category | null;
  account: Account | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function SubscriptionCard({ subscription, category, account, onEdit, onDelete }: SubscriptionCardProps) {
  const { isPrivate } = usePrivacy();
  const [pending, setPending] = useState(false);
  const tmpl = subscription.transaction_template as {
    type?: string; amount?: number; currency?: string;
    category_id?: string; notes?: string;
  };

  const label = tmpl.notes ?? "Subscription";
  const amount = tmpl.amount ?? 0;
  const currency = (tmpl.currency ?? "IDR") as string;
  const type = tmpl.type ?? "expense";
  const badge = dueBadge(subscription.next_due_date);

  return (
    <div className="rounded-lg border bg-card p-4 flex items-start gap-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          backgroundColor: category ? category.color + "20" : "var(--muted)",
        }}
      >
        {category ? (
          <CategoryIcon name={category.icon} color={category.color} />
        ) : (
          <Repeat className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {category?.name ?? "No category"} · {subscription.frequency}
              {account && <span className="normal-case"> · {account.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={cn(
                "text-xs font-semibold",
                type === "income" ? "text-[var(--tx-income-text)]" : "text-[var(--tx-expense-text)]"
              )}
            >
              {isPrivate ? "••••" : formatCurrency(amount, currency)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Subscription options"
                    disabled={pending}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                  </button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem
                  disabled={pending}
                  className="text-destructive"
                  onClick={async () => {
                    setPending(true);
                    try { await Promise.resolve(onDelete()); } finally { setPending(false); }
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-2">
          <span
            className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full font-medium",
              badge.variant === "error"
                ? "bg-destructive/15 text-destructive"
                : badge.variant === "warn"
                ? "bg-[var(--tx-expense-text)]/15 text-[var(--tx-expense-text)]"
                : "bg-muted text-muted-foreground"
            )}
          >
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}
