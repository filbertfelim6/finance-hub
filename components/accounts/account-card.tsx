"use client";

import {
  Wallet,
  Briefcase,
  CreditCard,
  Smartphone,
  Building2,
  MoreHorizontal,
  Landmark,
  PiggyBank,
  DollarSign,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types/database.types";

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

function AccountIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = ICON_MAP[name] ?? Wallet;
  return <Icon className={className} style={style} />;
}

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onArchive: () => void;
}

export function AccountCard({ account, onEdit, onArchive }: AccountCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: account.color + "22" }}
          >
            <AccountIcon
              name={account.icon}
              className="h-4 w-4"
              style={{ color: account.color }}
            />
          </div>
          <div>
            <p className="font-medium text-sm leading-tight">{account.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1" aria-label="more">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive} className="text-destructive">
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
        <p className="text-2xl font-semibold tabular-nums">
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>
    </div>
  );
}
