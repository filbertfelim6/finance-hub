"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useAccount } from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: account, isLoading } = useAccount(id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          render={<Link href="/accounts" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isLoading ? (
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold">{account?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {account
                ? formatCurrency(account.balance, account.currency)
                : ""}
            </p>
          </div>
        )}
      </div>

      <TransactionList baseOptions={{ accountId: id }} showFilters />
    </div>
  );
}
