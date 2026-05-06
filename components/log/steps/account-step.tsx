"use client";

import { useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatCurrency, convertCurrency, cn } from "@/lib/utils";
import type { TransactionType, Currency } from "@/lib/types/database.types";

interface AccountStepProps {
  transactionType: TransactionType;
  accountId: string | null;
  sourceAccountId: string | null;
  destAccountId: string | null;
  sourceAmount: string;
  sourceCurrency: Currency;
  destAmount: string;
  destCurrency: Currency;
  rates: Record<string, number>;
  onAccountSelect: (accountId: string) => void;
  onTransferSelect: (
    sourceAccountId: string,
    destAccountId: string,
    sourceAmount: string,
    sourceCurrency: Currency,
    destAmount: string,
    destCurrency: Currency
  ) => void;
}

function AccountButton({
  name,
  type,
  balance,
  currency,
  selected,
  disabled,
  onClick,
}: {
  name: string;
  type: string;
  balance: number;
  currency: Currency;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border p-3 transition-colors disabled:opacity-40",
        selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
      )}
    >
      <div className="text-left">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground capitalize">{type}</p>
      </div>
      <p className="text-sm tabular-nums text-muted-foreground">
        {formatCurrency(balance, currency)}
      </p>
    </button>
  );
}

export function AccountStep({
  transactionType,
  accountId,
  sourceAccountId,
  destAccountId,
  sourceAmount,
  sourceCurrency,
  destAmount,
  destCurrency,
  rates,
  onAccountSelect,
  onTransferSelect,
}: AccountStepProps) {
  const { data: accounts = [] } = useAccounts();

  const [localSource, setLocalSource] = useState(sourceAccountId ?? "");
  const [localDest, setLocalDest] = useState(destAccountId ?? "");
  const [localSourceAmount, setLocalSourceAmount] = useState(sourceAmount);
  const [localSourceCurrency, setLocalSourceCurrency] = useState<Currency>(sourceCurrency);
  const [localDestAmount, setLocalDestAmount] = useState(destAmount);
  const [localDestCurrency, setLocalDestCurrency] = useState<Currency>(destCurrency);
  const [destEdited, setDestEdited] = useState(false);

  const sameCurrency = localSourceCurrency === localDestCurrency;

  // Same-currency: mirror source amount into dest
  useEffect(() => {
    if (sameCurrency && !destEdited) setLocalDestAmount(localSourceAmount);
  }, [localSourceAmount, sameCurrency, destEdited]);

  // Cross-currency: auto-convert source amount into dest currency
  useEffect(() => {
    if (sameCurrency || destEdited) return;
    const src = parseFloat(localSourceAmount);
    if (!src || !localSourceCurrency || !localDestCurrency) { setLocalDestAmount(""); return; }
    const converted = convertCurrency(src, localSourceCurrency, localDestCurrency, rates);
    const decimals = localDestCurrency === "IDR" || localDestCurrency === "JPY" ? 0 : 2;
    setLocalDestAmount(converted > 0 ? converted.toFixed(decimals) : "");
  }, [localSourceAmount, localSourceCurrency, localDestCurrency, sameCurrency, destEdited, rates]);

  // Reset manual override when accounts or currencies change
  useEffect(() => {
    setDestEdited(false);
  }, [localSource, localDest, localSourceCurrency, localDestCurrency]);

  if (transactionType !== "transfer") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center">Account</h2>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <AccountButton
              key={acc.id}
              name={acc.name}
              type={acc.type}
              balance={acc.balance}
              currency={acc.currency}
              selected={accountId === acc.id}
              onClick={() => onAccountSelect(acc.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  const canContinue =
    !!localSource &&
    !!localDest &&
    localSource !== localDest &&
    parseFloat(localSourceAmount) > 0 &&
    parseFloat(localDestAmount) > 0;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-center">Transfer</h2>

      {/* FROM */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</p>
        <div className="space-y-1.5">
          {accounts.map((acc) => (
            <AccountButton
              key={acc.id}
              name={acc.name}
              type={acc.type}
              balance={acc.balance}
              currency={acc.currency}
              selected={localSource === acc.id}
              disabled={localDest === acc.id}
              onClick={() => {
                if (localSource === acc.id) {
                  setLocalSource("");
                } else {
                  setLocalSource(acc.id);
                  setLocalSourceCurrency(acc.currency);
                }
              }}
            />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <select
            value={localSourceCurrency}
            onChange={(e) => setLocalSourceCurrency(e.target.value as Currency)}
            className="h-9 w-20 shrink-0 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="SGD">SGD</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
          <NumericFormat
            thousandSeparator="."
            decimalSeparator=","
            value={localSourceAmount}
            onValueChange={(v) => setLocalSourceAmount(v.value)}
            placeholder="0"
            inputMode="decimal"
            className="h-9 flex-1 tabular-nums rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center">
        <div className="flex-1 border-t border-border" />
        <ArrowDown className="mx-3 h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 border-t border-border" />
      </div>

      {/* TO */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</p>
        <div className="space-y-1.5">
          {accounts.map((acc) => (
            <AccountButton
              key={acc.id}
              name={acc.name}
              type={acc.type}
              balance={acc.balance}
              currency={acc.currency}
              selected={localDest === acc.id}
              disabled={localSource === acc.id}
              onClick={() => {
                if (localDest === acc.id) {
                  setLocalDest("");
                } else {
                  setLocalDest(acc.id);
                  setLocalDestCurrency(acc.currency);
                }
              }}
            />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <select
            value={localDestCurrency}
            onChange={(e) => setLocalDestCurrency(e.target.value as Currency)}
            className="h-9 w-20 shrink-0 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="SGD">SGD</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
          <NumericFormat
            thousandSeparator="."
            decimalSeparator=","
            value={localDestAmount}
            onValueChange={(v) => {
              setLocalDestAmount(v.value);
              if (sameCurrency) setDestEdited(true);
            }}
            placeholder="0"
            inputMode="decimal"
            className="h-9 flex-1 tabular-nums rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {sameCurrency && (
          <p className="text-xs text-muted-foreground">
            {destEdited ? "Amount adjusted — change accounts to reset." : "Same currency — auto-filled. Edit to account for fees."}
          </p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!canContinue}
        onClick={() =>
          onTransferSelect(
            localSource,
            localDest,
            localSourceAmount,
            localSourceCurrency,
            localDestAmount,
            localDestCurrency
          )
        }
      >
        Continue
      </Button>
    </div>
  );
}
