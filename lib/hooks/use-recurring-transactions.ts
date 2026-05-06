import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecurringTransactions,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  type RecurringInput,
} from "@/lib/queries/recurring-transactions";

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: getRecurringTransactions,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringInput) => createRecurring(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-transactions"] }),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecurringInput }) =>
      updateRecurring(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-transactions"] }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-transactions"] }),
  });
}
