"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/lib/hooks/use-categories";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCreateRecurring, useUpdateRecurring } from "@/lib/hooks/use-recurring-transactions";
import { toast } from "sonner";
import type { RecurringTransaction } from "@/lib/types/database.types";

const schema = z.object({
  label: z.string().min(1, "Name is required").max(100),
  type: z.enum(["income", "expense"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.enum(["USD", "IDR", "EUR", "SGD", "GBP", "JPY"]),
  account_id: z.string().min(1, "Account is required"),
  category_id: z.string().min(1, "Category is required"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  next_due_date: z.string().min(1, "Start date is required"),
});

type Values = z.infer<typeof schema>;

function templateToValues(r: RecurringTransaction): Values {
  const t = r.transaction_template as {
    type?: string; amount?: number; currency?: string;
    account_id?: string; category_id?: string; notes?: string;
  };
  return {
    label: t.notes ?? "",
    type: (t.type === "income" ? "income" : "expense") as "income" | "expense",
    amount: t.amount ?? 0,
    currency: (t.currency ?? "IDR") as Values["currency"],
    account_id: t.account_id ?? "",
    category_id: t.category_id ?? "",
    frequency: r.frequency,
    next_due_date: r.next_due_date,
  };
}

interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  subscription?: RecurringTransaction;
}

export function SubscriptionForm({ open, onClose, subscription }: SubscriptionFormProps) {
  const isEdit = !!subscription;
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();
  const { data: accounts = [] } = useAccounts();
  const activeAccounts = accounts.filter((a) => !a.is_archived);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      type: "expense",
      amount: 0,
      currency: "IDR",
      account_id: "",
      category_id: "",
      frequency: "monthly",
      next_due_date: new Date().toISOString().split("T")[0],
    },
  });

  const txType = form.watch("type");
  const { data: categories = [] } = useCategories(txType);

  useEffect(() => {
    if (subscription) {
      form.reset(templateToValues(subscription));
    } else {
      form.reset({
        label: "",
        type: "expense",
        amount: 0,
        currency: "IDR",
        account_id: "",
        category_id: "",
        frequency: "monthly",
        next_due_date: new Date().toISOString().split("T")[0],
      });
    }
  }, [subscription, open]);

  async function onSubmit(values: Values) {
    const payload = {
      label: values.label,
      type: values.type,
      amount: values.amount,
      currency: values.currency,
      account_id: values.account_id,
      category_id: values.category_id,
      frequency: values.frequency,
      next_due_date: values.next_due_date,
    };
    try {
      if (isEdit) {
        await updateRecurring.mutateAsync({ id: subscription!.id, input: payload });
        toast.success("Subscription updated");
      } else {
        await createRecurring.mutateAsync(payload);
        toast.success("Subscription added");
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const pending = createRecurring.isPending || updateRecurring.isPending;
  const frequency = form.watch("frequency");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit subscription" : "Add subscription"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Netflix, Spotify…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <div className="flex rounded-md border border-input overflow-hidden">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { field.onChange(t); form.setValue("category_id", ""); }}
                        className={`flex-1 py-2 text-sm font-medium capitalize transition-colors border-l border-input first:border-l-0 ${
                          field.value === t
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account">
                          {(value: string | null) => {
                            if (!value) return undefined;
                            const acc = activeAccounts.find((a) => a.id === value);
                            return acc ? `${acc.name} (${acc.currency})` : value;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} · {acc.currency}
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
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next due date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add subscription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
