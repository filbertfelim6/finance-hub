"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { useAccounts, useArchiveAccount } from "@/lib/hooks/use-accounts";
import type { Account } from "@/lib/types/database.types";

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const archiveAccount = useArchiveAccount();
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add account
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && accounts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No accounts yet.</p>
          <Button variant="link" size="sm" onClick={openCreate}>
            Add your first account
          </Button>
        </div>
      )}

      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`} className="block">
              <AccountCard
                account={account}
                onEdit={(e) => {
                  e?.stopPropagation?.();
                  openEdit(account);
                }}
                onArchive={(e) => {
                  e?.stopPropagation?.();
                  archiveAccount.mutate(account.id);
                }}
              />
            </Link>
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
