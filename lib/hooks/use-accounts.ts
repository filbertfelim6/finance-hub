import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
  type CreateAccountInput,
} from "@/lib/queries/accounts";
import { useExchangeRates } from "./use-exchange-rate";

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => getAccount(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  const rates = useExchangeRates();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input, rates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<CreateAccountInput, "initialBalance">>;
    }) => updateAccount(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["accounts", id] });
    },
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
