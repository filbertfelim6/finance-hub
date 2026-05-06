import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  createTransaction,
  createTransfer,
  type CreateTransactionInput,
  type GetTransactionsOptions,
} from "@/lib/queries/transactions";
import { useExchangeRates } from "./use-exchange-rate";
import type { Currency } from "@/lib/types/database.types";

export function useTransactions(options: GetTransactionsOptions = {}) {
  return useQuery({
    queryKey: ["transactions", options],
    queryFn: () => getTransactions(options),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const rates = useExchangeRates();
  return useMutation({
    mutationFn: (
      input: Omit<CreateTransactionInput, "converted_amount_usd"> & {
        currency: Currency;
      }
    ) => {
      const fromRate = rates[input.currency] ?? 1;
      const convertedUsd = input.amount / fromRate;
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
  const rates = useExchangeRates();
  return useMutation({
    mutationFn: (params: {
      sourceAccountId: string;
      sourceAccountName: string;
      destAccountId: string;
      destAccountName: string;
      amount: number;
      sourceCurrency: Currency;
      sourceAccountCurrency: Currency;
      destCurrency: Currency;
      destAccountCurrency: Currency;
      destAmount: number;
      notes: string | null;
      date: string;
    }) => createTransfer({ ...params, ratesFromUsd: rates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
