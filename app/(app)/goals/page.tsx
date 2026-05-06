"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { useSavingsGoals, useDeleteSavingsGoal } from "@/lib/hooks/use-savings-goals";
import { useDisplayCurrency } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rate";
import { convertCurrency, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanTabs } from "@/components/layout/plan-tabs";
import { toast } from "sonner";
import type { SavingsGoal } from "@/lib/types/database.types";

export default function GoalsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | undefined>(undefined);

  const { data: goals = [], isLoading } = useSavingsGoals();
  const deleteGoal = useDeleteSavingsGoal();
  const { displayCurrency } = useDisplayCurrency();
  const { isPrivate } = usePrivacy();
  const rates = useExchangeRates();

  const totalSaved = goals.reduce(
    (s, g) => s + convertCurrency(g.current_amount, g.currency, displayCurrency, rates),
    0
  );
  const totalTarget = goals.reduce(
    (s, g) => s + convertCurrency(g.target_amount, g.currency, displayCurrency, rates),
    0
  );

  function openAdd() {
    setEditGoal(undefined);
    setFormOpen(true);
  }

  function openEdit(goal: SavingsGoal) {
    setEditGoal(goal);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal.mutateAsync(id);
      toast.success("Goal deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Savings Goals</h1>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <PlanTabs />

      {isLoading ? (
        <>
          <Skeleton className="h-20 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </>
      ) : (
        <>
          {goals.length > 0 && (
            <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Total Saved</p>
                <p className="text-lg font-semibold">
                  {isPrivate ? "••••" : formatCurrency(totalSaved, displayCurrency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Target</p>
                <p className="text-lg font-semibold">
                  {isPrivate ? "••••" : formatCurrency(totalTarget, displayCurrency)}
                </p>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-muted-foreground text-sm">No savings goals yet.</p>
              <Button size="sm" onClick={openAdd} variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add your first goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => handleDelete(goal.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        goal={editGoal}
      />
    </div>
  );
}
