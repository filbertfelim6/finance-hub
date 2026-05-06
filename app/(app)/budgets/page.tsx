"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { useBudgets, useDeleteBudget } from "@/lib/hooks/use-budgets";
import { useBudgetProgress } from "@/lib/hooks/use-dashboard";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanTabs } from "@/components/layout/plan-tabs";
import { toast } from "sonner";
import type { Budget } from "@/lib/types/database.types";

export default function BudgetsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | undefined>(undefined);

  const { data: budgets = [] } = useBudgets();
  const { data: progress, isLoading } = useBudgetProgress();
  const deleteBudget = useDeleteBudget();
  const { displayCurrency } = useDisplayCurrency();
  const { isPrivate } = usePrivacy();

  const totalBudgeted = progress.reduce((s, p) => s + p.budgetAmount, 0);
  const totalSpent = progress.reduce((s, p) => s + p.spent, 0);


  function openAdd() {
    setEditBudget(undefined);
    setFormOpen(true);
  }

  function openEdit(budget: Budget) {
    setEditBudget(budget);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteBudget.mutateAsync(id);
      toast.success("Budget deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const budgetById = Object.fromEntries(budgets.map((b) => [b.id, b]));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <PlanTabs />

      {isLoading ? (
        <>
          <Skeleton className="h-20 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        </>
      ) : (
        <>
          {progress.length > 0 && (
            <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-lg font-semibold">
                  {isPrivate ? "••••" : formatCurrency(totalSpent, displayCurrency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Budgeted</p>
                <p className="text-lg font-semibold">
                  {isPrivate ? "••••" : formatCurrency(totalBudgeted, displayCurrency)}
                </p>
              </div>
            </div>
          )}

          {progress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-muted-foreground text-sm">No budgets yet.</p>
              <Button size="sm" onClick={openAdd} variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add your first budget
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.map((point) => (
                <BudgetCard
                  key={point.budgetId}
                  point={point}
                  onEdit={() => openEdit(budgetById[point.budgetId])}
                  onDelete={() => handleDelete(point.budgetId)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        budget={editBudget}
      />
    </div>
  );
}
