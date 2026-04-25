import type { TransactionType, Currency } from "@/lib/types/database.types";

interface AccountStepProps {
  transactionType: TransactionType;
  accountId: string | null;
  sourceAccountId: string | null;
  destAccountId: string | null;
  destAmount: string;
  sourceCurrency: Currency;
  onAccountSelect: (accountId: string) => void;
  onTransferSelect: (sourceAccountId: string, destAccountId: string, destAmount: string) => void;
}

export function AccountStep({ onAccountSelect }: AccountStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Account</h2>
      <p className="text-sm text-muted-foreground text-center">Loading accounts…</p>
    </div>
  );
}
