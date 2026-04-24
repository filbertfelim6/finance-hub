import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, createCategory } from "@/lib/queries/categories";
import type { CategoryType } from "@/lib/types/database.types";

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => getCategories(type),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
