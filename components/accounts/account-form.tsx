"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import {
  Wallet, CreditCard, Building, Smartphone, Landmark, PiggyBank,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { useCreateAccount, useUpdateAccount } from "@/lib/hooks/use-accounts";
import type { Account } from "@/lib/types/database.types";

const ACCOUNT_ICONS = [
  { value: "wallet",      Icon: Wallet },
  { value: "credit-card", Icon: CreditCard },
  { value: "building",    Icon: Building },
  { value: "smartphone",  Icon: Smartphone },
  { value: "landmark",    Icon: Landmark },
  { value: "piggy-bank",  Icon: PiggyBank },
];

const COLOR_PALETTE = [
  "#5a7a4e", "#7d9870", "#c89b3c", "#b8615a", "#5a7a8e",
  "#8b6f9c", "#c87941", "#4e7a6e", "#7a5a8e", "#8e7a4e",
];

function randomColor() {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["checking", "savings", "cash", "ewallet"]),
  currency: z.enum(["USD", "IDR", "EUR", "SGD", "GBP", "JPY"]),
  initialBalance: z.number().min(0, "Balance must be 0 or more"),
  color: z.string(),
  icon: z.string(),
});

type Values = z.infer<typeof schema>;

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  account?: Account;
}

export function AccountForm({ open, onClose, account }: AccountFormProps) {
  const isEdit = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "checking",
      currency: "IDR",
      initialBalance: 0,
      color: "#5a7a4e",
      icon: "wallet",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: account.balance,
        color: account.color,
        icon: account.icon,
      });
    } else {
      form.reset({
        name: "",
        type: "checking",
        currency: "IDR",
        initialBalance: 0,
        color: randomColor(),
        icon: "wallet",
      });
    }
  }, [account, open]);

  async function onSubmit(values: Values) {
    if (isEdit) {
      await updateAccount.mutateAsync({
        id: account!.id,
        data: {
          name: values.name,
          type: values.type,
          color: values.color,
          icon: values.icon,
        },
      });
    } else {
      await createAccount.mutateAsync({
        name: values.name,
        type: values.type,
        currency: values.currency,
        initialBalance: values.initialBalance,
        color: values.color,
        icon: values.icon,
      });
    }
    onClose();
  }

  const pending = createAccount.isPending || updateAccount.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
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
                    <Input placeholder="BCA Savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="ewallet">E-Wallet</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEdit}
                    >
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
            {!isEdit && (
              <FormField
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial balance</FormLabel>
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
            )}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <div className="flex gap-2">
                    {ACCOUNT_ICONS.map(({ value, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg border transition-colors",
                          field.value === value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(createAccount.error || updateAccount.error) && (
              <p className="text-sm text-destructive">
                {(createAccount.error || updateAccount.error)?.message}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
