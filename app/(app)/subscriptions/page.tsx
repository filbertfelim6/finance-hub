"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { useRecurringTransactions, useDeleteRecurring } from "@/lib/hooks/use-recurring-transactions";
import { useCategories } from "@/lib/hooks/use-categories";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { PlanTabs } from "@/components/layout/plan-tabs";
import { toast } from "sonner";
import type { RecurringTransaction } from "@/lib/types/database.types";

export default function SubscriptionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editSub, setEditSub] = useState<RecurringTransaction | undefined>(undefined);

  const { data: subscriptions = [] } = useRecurringTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const deleteRecurring = useDeleteRecurring();

  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accById = Object.fromEntries(accounts.map((a) => [a.id, a]));

  function openAdd() {
    setEditSub(undefined);
    setFormOpen(true);
  }

  function openEdit(sub: RecurringTransaction) {
    setEditSub(sub);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteRecurring.mutateAsync(id);
      toast.success("Subscription deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <PlanTabs />

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">No subscriptions yet.</p>
          <Button size="sm" onClick={openAdd} variant="outline" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add your first subscription
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => {
            const tmpl = sub.transaction_template as { category_id?: string; account_id?: string };
            const category = tmpl.category_id ? (catById[tmpl.category_id] ?? null) : null;
            const account = tmpl.account_id ? (accById[tmpl.account_id] ?? null) : null;
            return (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                category={category}
                account={account}
                onEdit={() => openEdit(sub)}
                onDelete={() => handleDelete(sub.id)}
              />
            );
          })}
        </div>
      )}

      <SubscriptionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subscription={editSub}
      />
    </div>
  );
}
