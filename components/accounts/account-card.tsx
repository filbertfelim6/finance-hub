"use client";

import { useState } from "react";
import {
  Wallet, Briefcase, CreditCard, Smartphone, Building2,
  MoreHorizontal, Landmark, PiggyBank, DollarSign, BadgeDollarSign, Loader2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency, convertCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types/database.types";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rate";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  wallet: Wallet,
  briefcase: Briefcase,
  "credit-card": CreditCard,
  smartphone: Smartphone,
  building: Building2,
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  dollar: DollarSign,
  badge: BadgeDollarSign,
};

function AccountIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name] ?? Wallet;
  return <Icon className={className} style={style} />;
}

interface AccountCardProps {
  account: Account;
  onEdit: (e?: React.MouseEvent) => void;
  onArchive: (e?: React.MouseEvent) => void;
}

export function AccountCard({ account, onEdit, onArchive }: AccountCardProps) {
  const { displayCurrency } = useDisplayCurrency();
  const rates = useExchangeRates();
  const [pending, setPending] = useState(false);
  const displayBalance = convertCurrency(account.balance, account.currency, displayCurrency, rates);
  const showNative = displayCurrency !== account.currency;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4 transition-colors hover:bg-accent/30">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: account.color + "20" }}
          >
            <AccountIcon name={account.icon} className="h-4 w-4" style={{ color: account.color }} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{account.name}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{account.type}</p>
          </div>
        </div>

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div onClick={(e) => e.stopPropagation()} role="none" className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Account options"
                  disabled={pending}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 -mr-1 -mt-0.5")}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit()}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                disabled={pending}
                className="text-destructive"
                onClick={async () => {
                  setPending(true);
                  try { await Promise.resolve(onArchive()); } finally { setPending(false); }
                }}
              >
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Balance */}
      <div className="pt-1 border-t">
        <p className="text-xs text-muted-foreground mb-1">Balance</p>
        <p className="text-2xl font-semibold tabular-nums truncate">
          {formatCurrency(displayBalance, displayCurrency)}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
          {showNative
            ? `≈ ${formatCurrency(account.balance, account.currency)}`
            : `= ${formatCurrency(account.balance, account.currency)}`}
        </p>
      </div>
    </div>
  );
}
