"use client";

import { useState } from "react";
import { Tag, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { cn } from "@/lib/utils";
import type { BudgetProgressPoint } from "@/lib/utils/dashboard";
import { ICON_MAP } from "@/lib/utils/icon-map";

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className="h-4 w-4" style={{ color }} />;
}

function barColor(pct: number): string {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 80) return "bg-[var(--tx-expense-text)]";
  return "bg-[var(--tx-income-text)]";
}

interface BudgetCardProps {
  point: BudgetProgressPoint;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ point, onEdit, onDelete }: BudgetCardProps) {
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();
  const clamped = Math.min(100, point.pct);
  const [pending, setPending] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: point.categoryColor + "20" }}
          >
            <CategoryIcon name={point.categoryIcon} color={point.categoryColor} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{point.categoryName}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{point.period}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Budget options"
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", point.pct >= 100 ? "text-destructive" : point.pct >= 80 ? "text-[var(--tx-expense-text)]" : "text-foreground")}>
            {isPrivate ? "••••" : formatCurrencyCompact(point.spent, displayCurrency)}
          </span>
          <span className="text-muted-foreground">
            {isPrivate ? "••••" : formatCurrency(point.budgetAmount, displayCurrency)}
          </span>
        </div>
        <Progress value={clamped}>
          <ProgressTrack>
            <ProgressIndicator className={barColor(point.pct)} />
          </ProgressTrack>
        </Progress>
        <p className="text-xs text-muted-foreground text-right">
          {isPrivate ? "•• %" : `${point.pct.toFixed(0)}% used`}
        </p>
      </div>
    </div>
  );
}
