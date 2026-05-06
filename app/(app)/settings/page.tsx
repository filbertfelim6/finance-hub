"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, Monitor, Trash2, Pencil, X, Check, Tag, Plus, LogOut, Loader2,
} from "lucide-react";
import { ICON_MAP } from "@/lib/utils/icon-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDisplayCurrency, DISPLAY_CURRENCIES } from "@/lib/context/display-currency-context";
import { usePrivacy } from "@/lib/context/privacy-context";
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from "@/lib/hooks/use-categories";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryType } from "@/lib/types/database.types";

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className="h-4 w-4" style={{ color }} />;
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon);

  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  async function handleSave() {
    try {
      await updateCategory.mutateAsync({ id: category.id, patch: { name, color, icon } });
      toast.success("Category updated");
      setEditing(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Category deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: category.color + "25" }}
        >
          <CategoryIcon name={category.icon} color={category.color} />
        </div>
        <span className="flex-1 text-sm">{category.name}</span>
        {!category.is_system && (
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)} disabled={deleteCategory.isPending}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />
              }
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-2 space-y-3 rounded-lg bg-muted/40 p-3 -mx-1">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm flex-1"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {Object.entries(ICON_MAP).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setIcon(key)}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-md border transition-colors",
              icon === key ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
            )}
          >
            <Icon className="h-3 w-3" style={{ color }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="relative w-8 h-8 rounded-md border border-border cursor-pointer overflow-hidden shrink-0"
          style={{ backgroundColor: color }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <code className="text-xs text-muted-foreground">{color.toUpperCase()}</code>
        <Button size="sm" className="ml-auto h-8 gap-1.5" onClick={handleSave} disabled={updateCategory.isPending}>
          <Check className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

function AddCategoryRow({ type }: { type: CategoryType }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#5a7a4e");
  const [icon, setIcon] = useState("tag");
  const createCategory = useCreateCategory();

  async function handleAdd() {
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync({ name: name.trim(), type, icon, color });
      toast.success("Category added");
      setOpen(false);
      setName("");
      setColor("#5a7a4e");
      setIcon("tag");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground w-full text-left transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add category
      </button>
    );
  }

  return (
    <div className="py-2 space-y-3 rounded-lg bg-muted/40 p-3 -mx-1">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="h-8 text-sm flex-1"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {Object.entries(ICON_MAP).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setIcon(key)}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-md border transition-colors",
              icon === key ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
            )}
          >
            <Icon className="h-3 w-3" style={{ color }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="relative w-8 h-8 rounded-md border border-border cursor-pointer overflow-hidden shrink-0"
          style={{ backgroundColor: color }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <code className="text-xs text-muted-foreground">{color.toUpperCase()}</code>
        <Button size="sm" className="ml-auto h-8 gap-1.5" onClick={handleAdd} disabled={createCategory.isPending}>
          <Check className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

function CategoriesSection() {
  const { data: incomeCategories = [], isLoading: incomeLoading } = useCategories("income");
  const { data: expenseCategories = [], isLoading: expenseLoading } = useCategories("expense");
  const isLoading = incomeLoading || expenseLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-7 h-7 rounded-md shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="expense">
          <div className="divide-y divide-border">
            {expenseCategories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
            <AddCategoryRow type="expense" />
          </div>
        </TabsContent>
        <TabsContent value="income">
          <div className="divide-y divide-border">
            {incomeCategories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
            <AddCategoryRow type="income" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function userInitials(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function SettingsPage() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setMemberSince(
          new Date(user.created_at).toLocaleDateString("en-US", {
            month: "long", year: "numeric",
          })
        );
      }
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed");
      setSigningOut(false);
      return;
    }
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Appearance</h2>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-sm font-medium mb-3">Theme</p>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => {
              const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
              const isActive = mounted && theme === t;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 py-3 rounded-lg border text-xs font-medium transition-colors capitalize",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Display */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Display</h2>
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Display currency</p>
              <p className="text-xs text-muted-foreground mt-0.5">All amounts are shown in this currency</p>
            </div>
            <Select value={displayCurrency} onValueChange={(v) => v && setDisplayCurrency(v)}>
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_CURRENCIES.map((c) => (
                  <SelectItem
                    key={c.code}
                    value={c.code}
                    description={c.label.split(" — ")[1]}
                  >
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Privacy mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hide all amounts and balances</p>
            </div>
            {mounted && (
              <Switch checked={isPrivate} onCheckedChange={togglePrivacy} />
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categories</h2>
        <div className="rounded-xl border bg-card p-4">
          <CategoriesSection />
        </div>
      </section>

      <Separator />

      {/* Account */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
        <div className="rounded-xl border bg-card p-4 space-y-4">
          {userEmail && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {userInitials(userEmail)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userEmail}</p>
                  {memberSince && (
                    <p className="text-xs text-muted-foreground mt-0.5">Member since {memberSince}</p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sign out of your account on this device</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="gap-2 shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
