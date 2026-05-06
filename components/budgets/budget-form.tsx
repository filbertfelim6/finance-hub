"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/lib/hooks/use-categories";
import { useCreateBudget, useUpdateBudget } from "@/lib/hooks/use-budgets";
import { toast } from "sonner";
import type { Budget } from "@/lib/types/database.types";

const schema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  currency: z.enum(["USD", "IDR", "EUR", "SGD", "GBP", "JPY"]),
  period: z.enum(["monthly", "weekly"]),
});

type Values = z.infer<typeof schema>;

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  budget?: Budget;
}

export function BudgetForm({ open, onClose, budget }: BudgetFormProps) {
  const isEdit = !!budget;
  const { data: categories = [] } = useCategories("expense");
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: "",
      amount: 0,
      currency: "IDR",
      period: "monthly",
    },
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        category_id: budget.category_id ?? "",
        amount: budget.amount,
        currency: budget.currency,
        period: budget.period,
      });
    } else {
      form.reset({
        category_id: "",
        amount: 0,
        currency: "IDR",
        period: "monthly",
      });
    }
  }, [budget, open]);

  async function onSubmit(values: Values) {
    try {
      if (isEdit) {
        await updateBudget.mutateAsync({ id: budget!.id, patch: values });
        toast.success("Budget updated");
      } else {
        await createBudget.mutateAsync(values);
        toast.success("Budget created");
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const pending = createBudget.isPending || updateBudget.isPending;
  const period = form.watch("period");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit budget" : "Add budget"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category">
                          {(value: string | null) => {
                            if (!value) return undefined;
                            const cat = categories.find((c) => c.id === value);
                            return cat?.name ?? value;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        allowNegative={false}
                        allowLeadingZeros={false}
                        value={field.value || ""}
                        onValueChange={(v) => field.onChange(v.floatValue ?? 0)}
                        placeholder="0"
                        inputMode="decimal"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IDR">IDR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SGD">SGD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <div className="flex rounded-md border border-input overflow-hidden">
                    <button
                      type="button"
                      onClick={() => field.onChange("monthly")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        period === "monthly"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("weekly")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-input ${
                        period === "weekly"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add budget"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
