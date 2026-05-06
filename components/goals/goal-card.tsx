"use client";

import { useState, useEffect } from "react";
import { Target, MoreHorizontal, Loader2 } from "lucide-react";
import { ICON_MAP } from "@/lib/utils/icon-map";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatCurrencyCompact, convertCurrency, cn } from "@/lib/utils";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rate";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useAddContribution } from "@/lib/hooks/use-savings-goals";
import { toast } from "sonner";
import type { SavingsGoal } from "@/lib/types/database.types";

import type { LucideProps } from "lucide-react";
const GOAL_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = { ...ICON_MAP, target: Target };

function GoalIcon({ name, color }: { name: string; color: string }) {
  const Icon = GOAL_ICON_MAP[name] ?? Target;
  return <Icon className="h-5 w-5" style={{ color }} />;
}

function CircularRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

function deadlineBadge(deadline: string | null): { label: string; variant: "warn" | "error" | null } | null {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Past deadline", variant: "error" };
  if (diff <= 30) return { label: `${diff}d left`, variant: "warn" };
  return { label: `${diff}d left`, variant: null };
}

interface ContributeModalProps {
  goal: SavingsGoal;
  open: boolean;
  onClose: () => void;
}

function ContributeModal({ goal, open, onClose }: ContributeModalProps) {
  const { isPrivate } = usePrivacy();
  const rates = useExchangeRates();
  const { data: accounts = [] } = useAccounts();
  const addContribution = useAddContribution();

  const [amountRaw, setAmountRaw] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const activeAccounts = accounts.filter((a) => !a.is_archived);
  const selectedAccount = activeAccounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    if (!open) {
      setAmountRaw("");
      setSelectedAccountId("");
    }
  }, [open]);

  async function handleSubmit() {
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0 || !selectedAccount) return;
    try {
      await addContribution.mutateAsync({
        goalId: goal.id,
        goalName: goal.name,
        goalCurrency: goal.currency,
        amount,
        accountId: selectedAccount.id,
        accountCurrency: selectedAccount.currency,
        accountBalance: selectedAccount.balance,
        ratesFromUsd: rates,
      });
      toast.success("Contribution added");
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Contribute to {goal.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Account</label>
            <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account">
                  {(value: string | null) => {
                    if (!value) return undefined;
                    const acc = activeAccounts.find((a) => a.id === value);
                    return acc ? `${acc.name} (${acc.currency})` : value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} · {acc.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Available:{" "}
                <span className={selectedAccount.balance <= 0 ? "text-destructive" : ""}>
                  {isPrivate ? "••••" : formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount ({goal.currency})</label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={addContribution.isPending || !selectedAccountId || !amountRaw}
            >
              {addContribution.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Contribute"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const { isPrivate } = usePrivacy();
  const { displayCurrency } = useDisplayCurrency();
  const rates = useExchangeRates();

  const [contributeOpen, setContributeOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const currentDisplay = convertCurrency(goal.current_amount, goal.currency, displayCurrency, rates);
  const targetDisplay = convertCurrency(goal.target_amount, goal.currency, displayCurrency, rates);
  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const badge = deadlineBadge(goal.deadline);

  return (
    <>
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: goal.color + "30" }}
            >
              <GoalIcon name={goal.icon} color={goal.color} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm leading-tight truncate">{goal.name}</p>
              {badge && (
                <span className={`text-xs font-medium ${
                  badge.variant === "error" ? "text-destructive"
                  : badge.variant === "warn" ? "text-[var(--tx-expense-text)]"
                  : "text-muted-foreground"
                }`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Goal options"
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

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <CircularRing pct={pct} color={goal.color} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold">{isPrivate ? "••" : `${Math.round(pct)}%`}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold">
              {isPrivate ? "••••" : formatCurrencyCompact(currentDisplay, displayCurrency)}
            </p>
            <p className="text-xs text-muted-foreground">
              of {isPrivate ? "••••" : formatCurrency(targetDisplay, displayCurrency)}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs gap-1.5"
          onClick={() => setContributeOpen(true)}
        >
          + Contribute
        </Button>
      </div>

      <ContributeModal
        goal={goal}
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
      />
    </>
  );
}
