import { TransactionList } from "@/components/transactions/transaction-list";

export default function TransactionsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <TransactionList showFilters />
    </div>
  );
}
