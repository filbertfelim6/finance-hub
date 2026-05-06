"use client";

import { useState } from "react";
import { Plus, Scissors, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useCreateCategory } from "@/lib/hooks/use-categories";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/lib/types/database.types";
import { ICON_MAP } from "@/lib/utils/icon-map";

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className="h-3.5 w-3.5" style={{ color }} />;
}


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
  const [newColor, setNewColor] = useState("#5a7a4e");
  const [newIcon, setNewIcon] = useState("tag");

  async function handleAdd() {
    if (!newName.trim()) return;
    const cat = await createCategory.mutateAsync({
      name: newName.trim(),
      type,
      icon: newIcon,
      color: newColor,
    });
    setAdding(false);
    setNewName("");
    setNewColor("#5a7a4e");
    setNewIcon("tag");
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
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: cat.color + "33" }}
            >
              <CategoryIcon name={cat.icon} color={cat.color} />
            </div>
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
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Icon</p>
            <div className="grid grid-cols-8 gap-1">
              {Object.entries(ICON_MAP).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewIcon(key)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border transition-colors",
                    newIcon === key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: newColor }} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="relative w-8 h-8 rounded-lg border border-border cursor-pointer overflow-hidden shrink-0"
              style={{ backgroundColor: newColor }}
            >
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">Color</p>
            <code className="text-xs text-muted-foreground">{newColor.toUpperCase()}</code>
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
