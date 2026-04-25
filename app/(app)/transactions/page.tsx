"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { exportToCsv } from "@/lib/utils";
import type { Transaction } from "@/lib/types/database.types";

export default function TransactionsPage() {
  const { data: transactions = [] } = useTransactions();

  function handleExport() {
    const rows = transactions.map((t: Transaction) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      converted_usd: t.converted_amount_usd ?? "",
      category_id: t.category_id ?? "",
      notes: t.notes ?? "",
      account_id: t.account_id,
    }));
    exportToCsv(rows, `moonlit-transactions-${new Date().toISOString().split("T")[0]}.csv`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      <TransactionList showFilters />
    </div>
  );
}
