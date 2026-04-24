"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useCreateAccount, useUpdateAccount } from "@/lib/hooks/use-accounts";
import type { Account } from "@/lib/types/database.types";

const ACCOUNT_COLORS = [
  "#6366f1",
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

const ACCOUNT_ICONS = [
  { value: "wallet", label: "Wallet" },
  { value: "credit-card", label: "Card" },
  { value: "building", label: "Bank" },
  { value: "smartphone", label: "E-Wallet" },
  { value: "landmark", label: "Landmark" },
  { value: "piggy-bank", label: "Piggy Bank" },
];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["checking", "savings", "cash", "ewallet"]),
  currency: z.enum(["USD", "IDR"]),
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
      color: "#6366f1",
      icon: "wallet",
    },
  });

  useEffect(() => {
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
        color: "#6366f1",
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
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {ACCOUNT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: field.value === c ? "white" : "transparent",
                          outlineOffset: "2px",
                          outline: field.value === c ? `2px solid ${c}` : "none",
                        }}
                        onClick={() => field.onChange(c)}
                      />
                    ))}
                  </div>
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
                  <div className="flex gap-2 flex-wrap">
                    {ACCOUNT_ICONS.map((i) => (
                      <button
                        key={i.value}
                        type="button"
                        className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                          field.value === i.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => field.onChange(i.value)}
                      >
                        {i.label}
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
