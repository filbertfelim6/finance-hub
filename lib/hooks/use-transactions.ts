import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  createTransaction,
  createTransfer,
  type CreateTransactionInput,
  type GetTransactionsOptions,
} from "@/lib/queries/transactions";
import { useUsdToIdr } from "./use-exchange-rate";
import type { Currency } from "@/lib/types/database.types";

export function useTransactions(options: GetTransactionsOptions = {}) {
  return useQuery({
    queryKey: ["transactions", options],
    queryFn: () => getTransactions(options),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const usdToIdr = useUsdToIdr();
  return useMutation({
    mutationFn: (
      input: Omit<CreateTransactionInput, "converted_amount_usd"> & {
        currency: Currency;
      }
    ) => {
      const convertedUsd =
        input.currency === "USD" ? input.amount : input.amount / usdToIdr;
      return createTransaction({ ...input, converted_amount_usd: convertedUsd });
    },
    onSuccess: (txn) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts", txn.account_id] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  const usdToIdr = useUsdToIdr();
  return useMutation({
    mutationFn: (params: {
      sourceAccountId: string;
      destAccountId: string;
      amount: number;
      sourceCurrency: Currency;
      destCurrency: Currency;
      destAmount: number;
      notes: string | null;
      date: string;
    }) => createTransfer({ ...params, usdToIdrRate: usdToIdr }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
