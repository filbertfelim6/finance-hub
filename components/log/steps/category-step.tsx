"use client";

import { useState } from "react";
import { Plus, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useCreateCategory } from "@/lib/hooks/use-categories";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/lib/types/database.types";

const CATEGORY_COLORS = ["#22c55e","#ef4444","#f97316","#eab308","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];

interface CategoryStepProps {
  type: CategoryType;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSplitMode: () => void;
}

export function CategoryStep({ type, selectedId, onSelect, onSplitMode }: CategoryStepProps) {
  const { data: categories = [] } = useCategories(type);
  const createCategory = useCreateCategory();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);

  async function handleAdd() {
    if (!newName.trim()) return;
    const cat = await createCategory.mutateAsync({
      name: newName.trim(),
      type,
      icon: "tag",
      color: newColor,
    });
    setAdding(false);
    setNewName("");
    setNewColor(CATEGORY_COLORS[0]);
    onSelect(cat.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Category</h2>
        <Button variant="ghost" size="sm" onClick={onSplitMode} className="text-xs gap-1">
          <Scissors className="h-3.5 w-3.5" />
          Split
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 border transition-colors text-xs font-medium",
              selectedId === cat.id
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            )}
          >
            <div
              className="w-7 h-7 rounded-full"
              style={{ backgroundColor: cat.color + "33" }}
            />
            <span className="truncate w-full text-center">{cat.name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex flex-col items-center gap-1.5 rounded-xl p-3 border border-dashed border-border hover:bg-muted transition-colors text-xs font-medium text-muted-foreground"
        >
          <Plus className="h-5 w-5" />
          <span>New</span>
        </button>
      </div>

      {adding && (
        <div className="space-y-3 rounded-xl border p-3">
          <Input
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full border-2"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? "white" : "transparent",
                  outline: newColor === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || createCategory.isPending}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
