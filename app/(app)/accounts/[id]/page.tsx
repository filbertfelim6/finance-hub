"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useAccount } from "@/lib/hooks/use-accounts";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: account, isLoading } = useAccount(id);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-start gap-3 pb-5 mb-6 border-b">
        <Link
          href="/accounts"
          aria-label="Back to accounts"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 mt-0.5 shrink-0")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {isLoading ? (
          <div className="space-y-2 flex-1">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{account?.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {account ? (
                <>
                  <span className="capitalize">{account.type}</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Transactions</h2>
        <TransactionList baseOptions={{ accountId: id }} showFilters />
      </div>
    </div>
  );
}
