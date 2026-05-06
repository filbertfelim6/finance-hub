"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { ICON_MAP } from "@/lib/utils/icon-map";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateSavingsGoal, useUpdateSavingsGoal } from "@/lib/hooks/use-savings-goals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SavingsGoal } from "@/lib/types/database.types";

import type { LucideProps } from "lucide-react";
const GOAL_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = { target: Target, ...ICON_MAP };

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  target_amount: z.number().min(1, "Target must be greater than 0"),
  currency: z.enum(["USD", "IDR", "EUR", "SGD", "GBP", "JPY"]),
  deadline: z.string().optional(),
  color: z.string(),
  icon: z.string(),
});

type Values = z.infer<typeof schema>;

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  goal?: SavingsGoal;
}

export function GoalForm({ open, onClose, goal }: GoalFormProps) {
  const isEdit = !!goal;
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      target_amount: 0,
      currency: "IDR",
      deadline: "",
      color: "#5a7a4e",
      icon: "target",
    },
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        target_amount: goal.target_amount,
        currency: goal.currency,
        deadline: goal.deadline ?? "",
        color: goal.color,
        icon: goal.icon,
      });
    } else {
      form.reset({
        name: "", target_amount: 0, currency: "IDR",
        deadline: "", color: "#5a7a4e", icon: "target",
      });
    }
  }, [goal, open]);

  async function onSubmit(values: Values) {
    const payload = {
      name: values.name,
      target_amount: values.target_amount,
      currency: values.currency,
      deadline: values.deadline || null,
      color: values.color,
      icon: values.icon,
    };
    try {
      if (isEdit) {
        await updateGoal.mutateAsync({ id: goal!.id, patch: payload });
        toast.success("Goal updated");
      } else {
        await createGoal.mutateAsync(payload);
        toast.success("Goal created");
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const pending = createGoal.isPending || updateGoal.isPending;
  const color = form.watch("color");
  const icon = form.watch("icon");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "Add goal"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Emergency Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target amount</FormLabel>
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
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <div className="grid grid-cols-8 gap-1">
                    {Object.entries(GOAL_ICON_MAP).map(([key, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => field.onChange(key)}
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg border transition-colors",
                          field.value === key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-10 h-10 rounded-lg border border-border cursor-pointer overflow-hidden shrink-0"
                        style={{ backgroundColor: field.value }}
                      >
                        <input
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <code className="text-sm text-muted-foreground">{field.value.toUpperCase()}</code>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add goal"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
