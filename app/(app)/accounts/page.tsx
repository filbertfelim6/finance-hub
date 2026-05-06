"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { useAccounts, useArchiveAccount } from "@/lib/hooks/use-accounts";
import { useDisplayCurrency, DISPLAY_CURRENCIES } from "@/lib/context/display-currency-context";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Account } from "@/lib/types/database.types";

export default function AccountsPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useAccounts();
  const archiveAccount = useArchiveAccount();
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditTarget(account);
    setFormOpen(true);
  }

  async function handleArchive(id: string) {
    try {
      await archiveAccount.mutateAsync(id);
      toast.success("Account archived");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3 pb-5 mb-6 border-b">
        <h1 className="text-xl font-semibold tracking-tight mr-auto">Accounts</h1>
        <Select value={displayCurrency} onValueChange={(v) => v && setDisplayCurrency(v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISPLAY_CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-xs">
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add account
        </Button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground mb-3">No accounts yet.</p>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add your first account
          </Button>
        </div>
      )}

      {/* Account grid */}
      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="cursor-pointer"
              onClick={() => router.push(`/accounts/${account.id}`)}
            >
              <AccountCard
                account={account}
                onEdit={() => openEdit(account)}
                onArchive={() => handleArchive(account.id)}
              />
            </div>
          ))}
        </div>
      )}

      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        account={editTarget}
      />
    </div>
  );
}
