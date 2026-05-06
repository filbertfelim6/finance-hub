import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addContribution,
  type SavingsGoalInput,
  type AddContributionInput,
} from "@/lib/queries/savings-goals";

export function useSavingsGoals() {
  return useQuery({ queryKey: ["savings-goals"], queryFn: getSavingsGoals });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SavingsGoalInput) => createSavingsGoal(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useUpdateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SavingsGoalInput> }) =>
      updateSavingsGoal(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useAddContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddContributionInput) => addContribution(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings-goals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
