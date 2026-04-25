"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatCurrency, cn } from "@/lib/utils";
import type { TransactionType, Currency } from "@/lib/types/database.types";

interface AccountStepProps {
  transactionType: TransactionType;
  accountId: string | null;
  sourceAccountId: string | null;
  destAccountId: string | null;
  destAmount: string;
  sourceCurrency: Currency;
  onAccountSelect: (accountId: string) => void;
  onTransferSelect: (
    sourceAccountId: string,
    destAccountId: string,
    destAmount: string
  ) => void;
}

export function AccountStep({
  transactionType,
  accountId,
  sourceAccountId,
  destAccountId,
  destAmount,
  sourceCurrency,
  onAccountSelect,
  onTransferSelect,
}: AccountStepProps) {
  const { data: accounts = [] } = useAccounts();
  const [localSource, setLocalSource] = useState(sourceAccountId ?? "");
  const [localDest, setLocalDest] = useState(destAccountId ?? "");
  const [localDestAmount, setLocalDestAmount] = useState(destAmount);

  if (transactionType !== "transfer") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center">Account</h2>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => onAccountSelect(acc.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border p-3 transition-colors",
                accountId === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{acc.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
              </div>
              <p className="text-sm font-medium tabular-nums">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Transfer: source + dest + optional dest amount for cross-currency
  const sourceAcc = accounts.find((a) => a.id === localSource);
  const destAcc = accounts.find((a) => a.id === localDest);
  const isCrossCurrency = sourceAcc && destAcc && sourceAcc.currency !== destAcc.currency;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Transfer accounts</h2>

      <div>
        <p className="text-xs text-muted-foreground mb-2">From</p>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              disabled={localDest === acc.id}
              onClick={() => setLocalSource(acc.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border p-3 transition-colors disabled:opacity-40",
                localSource === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <p className="text-sm font-medium">{acc.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">To</p>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              disabled={localSource === acc.id}
              onClick={() => setLocalDest(acc.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border p-3 transition-colors disabled:opacity-40",
                localDest === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <p className="text-sm font-medium">{acc.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {isCrossCurrency && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Amount received ({destAcc.currency})
          </p>
          <Input
            type="number"
            min="0"
            step="any"
            value={localDestAmount}
            onChange={(e) => setLocalDestAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      )}

      <Button
        className="w-full"
        disabled={!localSource || !localDest || localSource === localDest}
        onClick={() =>
          onTransferSelect(
            localSource,
            localDest,
            isCrossCurrency ? localDestAmount : ""
          )
        }
      >
        Continue
      </Button>
    </div>
  );
}
