import type { CategoryType } from "@/lib/types/database.types";

interface CategoryStepProps {
  type: CategoryType;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSplitMode: () => void;
}

export function CategoryStep({ onSelect }: CategoryStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Category</h2>
      <p className="text-sm text-muted-foreground text-center">Loading categories…</p>
    </div>
  );
}
