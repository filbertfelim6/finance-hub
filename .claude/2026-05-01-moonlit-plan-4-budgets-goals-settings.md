# Moonlit Plan 4 — Budgets, Goals & Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Budgets, Goals, and Settings features — the final core pillars of Moonlit. Currency Cron is already complete. The DB schema, RLS, and TypeScript types for all three features already exist.

**What's already done (do not rebuild):**
- `app/api/cron/exchange-rates/route.ts` + `vercel.json` cron → hourly live rate refresh ✓
- `budgets`, `savings_goals`, `recurring_transactions` tables with RLS ✓
- `Budget`, `SavingsGoal`, `RecurringTransaction` TypeScript types in `lib/types/database.types.ts` ✓
- `/budgets` and `/settings` routes already wired in sidebar + bottom-nav ✓
- Settings page exists as a stub at `app/(app)/settings/page.tsx`

**Patterns to reuse:**
- Supabase queries → `lib/queries/accounts.ts` (fresh client, typed return, `if (error) throw error`)
- TanStack Query mutations → `lib/hooks/use-accounts.ts` (useQueryClient, invalidate on success)
- Forms → react-hook-form + Zod + shadcn `<Dialog>`, see `components/accounts/account-form.tsx`
- Color picker → HTML5 `<input type="color">` with invisible overlay div (same as account-form)
- Icon picker → button grid with `ICON_MAP` (same as `components/log/steps/category-step.tsx`)
- Toasts → `toast.success()` / `toast.error()` from `sonner`

---

## Task 1: DB Migration — Expand Currency Constraints

**Context:** `budgets.currency` and `savings_goals.currency` CHECK constraints are still limited to `USD, IDR`. Accounts support 6 currencies. Fix this before building any budget/goal UI.

**File to create:** `supabase/migrations/20260501000001_expand_budget_goal_currencies.sql`

- [ ] **Step 1: Write migration**

```sql
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_currency_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_currency_check
  CHECK (currency IN ('USD','IDR','EUR','SGD','GBP','JPY'));

ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_currency_check;
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_currency_check
  CHECK (currency IN ('USD','IDR','EUR','SGD','GBP','JPY'));
```

- [ ] **Step 2: Run in Supabase SQL editor** (same process as all prior migrations)

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260501000001_expand_budget_goal_currencies.sql
git commit -m "feat: expand budget and savings_goal currency constraints to all 6 currencies"
```

---

## Task 2: Progress Bar Component

- [ ] **Step 1: Install via shadcn**
```bash
npx shadcn@latest add progress --yes
```

Creates `components/ui/progress.tsx`. Used by budget cards.

- [ ] **Step 2: Verify**
```bash
npx tsc --noEmit
```

---

## Task 3: Budget Queries & Hook

### `lib/queries/budgets.ts`

- [ ] **Step 1: Write query functions**

```typescript
import { createClient } from "@/lib/supabase/client";
import type { Budget, Currency } from "@/lib/types/database.types";

export interface BudgetInput {
  category_id: string;
  amount: number;
  currency: Currency;
  period: "monthly" | "weekly";
}

export async function getBudgets(): Promise<Budget[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Budget[];
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}

export async function updateBudget(id: string, patch: Partial<BudgetInput>): Promise<Budget> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
```

### `lib/hooks/use-budgets.ts`

- [ ] **Step 2: Write hooks**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgets, createBudget, updateBudget, deleteBudget, type BudgetInput,
} from "@/lib/queries/budgets";

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: getBudgets });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BudgetInput> }) =>
      updateBudget(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
```

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add lib/queries/budgets.ts lib/hooks/use-budgets.ts
git commit -m "feat: add budget queries and hooks"
```

---

## Task 4: Budget Spend Utility

**Context:** Budget progress (spent vs limit) is computed client-side from already-fetched transactions. Add a pure utility function to `lib/utils/dashboard.ts`.

- [ ] **Step 1: Add `buildBudgetProgress` to `lib/utils/dashboard.ts`**

```typescript
export interface BudgetProgressPoint {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budgetAmount: number;   // converted to display currency
  spent: number;          // converted to display currency
  pct: number;            // spent / budgetAmount * 100 (can exceed 100)
  period: "monthly" | "weekly";
}

export function buildBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  rates: Record<string, number>,
  displayCurrency: string,
): BudgetProgressPoint[] {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const now = new Date();

  return budgets.map((b) => {
    const periodStart = b.period === "monthly"
      ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
      : (() => {
          const d = new Date(now);
          d.setDate(d.getDate() - d.getDay());
          return d.toISOString().split("T")[0];
        })();

    const spent = transactions
      .filter((t) => t.type === "expense" && t.category_id === b.category_id && t.date >= periodStart)
      .reduce((s, t) => {
        const inDisplay = t.currency === displayCurrency
          ? t.amount
          : (t.converted_amount_usd ?? t.amount / (rates[t.currency] ?? 1)) * (rates[displayCurrency] ?? 1);
        return s + inDisplay;
      }, 0);

    const budgetAmount = convertCurrency(b.amount, b.currency, displayCurrency, rates);
    const cat = catById[b.category_id];

    return {
      budgetId: b.id,
      categoryId: b.category_id,
      categoryName: cat?.name ?? "Unknown",
      categoryColor: cat?.color ?? "#94a3b8",
      categoryIcon: cat?.icon ?? "tag",
      budgetAmount,
      spent,
      pct: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
      period: b.period,
    };
  });
}
```

Note: Add `import type { Budget } from "@/lib/types/database.types"` at the top of dashboard.ts (alongside existing imports).

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add lib/utils/dashboard.ts
git commit -m "feat: add buildBudgetProgress utility for budget vs spend calculation"
```

---

## Task 5: Budget UI Components

### `components/budgets/budget-form.tsx`

- [ ] **Step 1: Write the form component**

Dialog with react-hook-form + Zod. Fields:
- Category (Select from `useCategories("expense")`)
- Amount (number input)
- Currency (Select: USD, IDR, EUR, SGD, GBP, JPY)
- Period (two-button toggle: Monthly / Weekly)

```typescript
const schema = z.object({
  category_id: z.string().min(1, "Select a category"),
  amount: z.number({ invalid_type_error: "Enter an amount" }).positive("Amount must be positive"),
  currency: z.enum(["USD","IDR","EUR","SGD","GBP","JPY"]),
  period: z.enum(["monthly","weekly"]),
});
```

Open/close controlled by `open: boolean` + `onClose: () => void` props.
Accepts optional `budget?: Budget` prop for edit mode.

### `components/budgets/budget-card.tsx`

- [ ] **Step 2: Write the card component**

Props: `progress: BudgetProgressPoint`

Layout:
- Row: category icon (colored circle) + category name + period badge + three-dot dropdown (Edit, Delete)
- Progress bar (shadcn `<Progress value={Math.min(progress.pct, 100)} />`)
  - className: green when pct < 80, yellow 80–99, red 100+
- Row: `Spent: {formatCurrency(spent, displayCurrency)}` / `Budget: {formatCurrency(budgetAmount, displayCurrency)}`

Use `useDeleteBudget()` for delete. Pass `onEdit` callback to open form.

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add components/budgets/budget-form.tsx components/budgets/budget-card.tsx
git commit -m "feat: add budget form dialog and budget card components"
```

---

## Task 6: Budgets Page

**File:** `app/(app)/budgets/page.tsx`

- [ ] **Step 1: Write the page**

```typescript
"use client";

// Data: useBudgets(), useCategories(), useTransactions({ dateFrom: startOfMonth }), useExchangeRates()
// Compute: buildBudgetProgress(budgets, transactions, categories, rates, displayCurrency)
// Split into monthly and weekly sections

// Layout:
// - Header: "Budgets" + "Add Budget" button
// - Summary strip: total budgeted vs total spent (this period, display currency)
// - Monthly budgets section (if any)
// - Weekly budgets section (if any)
// - Empty state: "No budgets yet. Add one to start tracking."
```

`dateFrom` for the transactions query: first day of current month (for monthly) and first day of current week (for weekly). Use the current month start as a conservative minimum: `new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]`.

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manual test** — create a budget, log an expense in that category, confirm progress bar updates.

- [ ] **Step 4: Commit**
```bash
git add app/(app)/budgets/page.tsx
git commit -m "feat: add budgets page with spend progress"
```

---

## Task 7: Savings Goals Queries & Hook

### `lib/queries/savings-goals.ts`

- [ ] **Step 1: Write query functions**

```typescript
import { createClient } from "@/lib/supabase/client";
import type { SavingsGoal, Currency } from "@/lib/types/database.types";

export interface SavingsGoalInput {
  name: string;
  target_amount: number;
  currency: Currency;
  deadline?: string | null;    // YYYY-MM-DD
  color: string;
  icon: string;
  linked_account_id?: string | null;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]>
export async function createSavingsGoal(input: SavingsGoalInput): Promise<SavingsGoal>
export async function updateSavingsGoal(id: string, patch: Partial<SavingsGoalInput>): Promise<SavingsGoal>
export async function deleteSavingsGoal(id: string): Promise<void>
export async function addContribution(id: string, amount: number): Promise<SavingsGoal>
  // addContribution: fetch current_amount, then update(current_amount + amount)
```

### `lib/hooks/use-savings-goals.ts`

- [ ] **Step 2: Write hooks**

- `useSavingsGoals()` — `useQuery(["savings-goals"])`
- `useCreateSavingsGoal()`, `useUpdateSavingsGoal()`, `useDeleteSavingsGoal()` — each invalidates `["savings-goals"]`
- `useAddContribution()` — invalidates `["savings-goals"]`

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add lib/queries/savings-goals.ts lib/hooks/use-savings-goals.ts
git commit -m "feat: add savings goal queries and hooks"
```

---

## Task 8: Goals UI Components

### `components/goals/goal-form.tsx`

- [ ] **Step 1: Write the form component**

Dialog with react-hook-form + Zod. Fields:
- Name (text)
- Target amount (number) + Currency (Select)
- Deadline (date input, optional)
- Color — HTML5 color picker (same pattern as account-form)
- Icon — icon grid (same `ICON_MAP` pattern as category-step)
- Linked account — optional Select from `useAccounts()`

### `components/goals/goal-card.tsx`

- [ ] **Step 2: Write the card component**

Props: `goal: SavingsGoal`

Layout:
- Top row: color circle with icon + goal name + deadline badge + three-dot dropdown (Edit, Delete)
- SVG circular progress ring (inline — no extra library):
  ```
  r = 36, circumference = 2πr ≈ 226
  strokeDashoffset = circumference * (1 - Math.min(pct/100, 1))
  ```
- Center text: `{pct.toFixed(0)}%`
- Below ring: `{formatCurrency(current_amount)} / {formatCurrency(target_amount)}`
- "+ Contribute" button → inline expand: number input + "Add" button
  - On confirm: calls `useAddContribution().mutateAsync(goal.id, amount)`

Deadline display:
- If deadline: compute days remaining → "12 days left" (green) / "Past deadline" (red) / "Due today" (yellow)
- If no deadline: nothing

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add components/goals/goal-form.tsx components/goals/goal-card.tsx
git commit -m "feat: add savings goal form dialog and goal card with progress ring"
```

---

## Task 9: Goals Page & Nav

### Add `/goals` to navigation

- [ ] **Step 1: Update `components/layout/sidebar.tsx`**

Add after the Budgets nav item:
```typescript
{ href: "/goals", icon: Target, label: "Goals" }
```
Import `Target` from `lucide-react`.

- [ ] **Step 2: Update `components/layout/bottom-nav.tsx`**

Same — add Goals item with `Target` icon.

### `app/(app)/goals/page.tsx`

- [ ] **Step 3: Write the page**

```typescript
"use client";

// Data: useSavingsGoals(), useDisplayCurrency()
// Layout:
// - Header: "Savings Goals" + "Add Goal" button
// - Summary: total saved vs total target in display currency
// - Goals grid (2 cols on md+)
// - Empty state: "No goals yet. Add one to start saving."
```

- [ ] **Step 4: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**
```bash
git add components/layout/sidebar.tsx components/layout/bottom-nav.tsx app/(app)/goals/page.tsx
git commit -m "feat: add savings goals page and Goals nav item"
```

---

## Task 10: Category Mutations (for Settings)

**Context:** Settings needs to edit and delete categories. Currently only `useCreateCategory` exists.

### `lib/queries/categories.ts` additions

- [ ] **Step 1: Add `updateCategory` and `deleteCategory`**

```typescript
export async function updateCategory(
  id: string,
  patch: { name?: string; icon?: string; color?: string }
): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
```

### `lib/hooks/use-categories.ts` additions

- [ ] **Step 2: Add `useUpdateCategory` and `useDeleteCategory`**

```typescript
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; icon?: string; color?: string } }) =>
      updateCategory(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
```

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add lib/queries/categories.ts lib/hooks/use-categories.ts
git commit -m "feat: add updateCategory and deleteCategory queries and hooks"
```

---

## Task 11: Recurring Transactions (read-only list for Settings)

### `lib/queries/recurring-transactions.ts`

- [ ] **Step 1: Write queries**

```typescript
import { createClient } from "@/lib/supabase/client";
import type { RecurringTransaction } from "@/lib/types/database.types";

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as RecurringTransaction[];
}

export async function deleteRecurring(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
  if (error) throw error;
}
```

### `lib/hooks/use-recurring-transactions.ts`

- [ ] **Step 2: Write hooks**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecurringTransactions, deleteRecurring } from "@/lib/queries/recurring-transactions";

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: getRecurringTransactions,
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurring(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-transactions"] }),
  });
}
```

- [ ] **Step 3: Commit**
```bash
git add lib/queries/recurring-transactions.ts lib/hooks/use-recurring-transactions.ts
git commit -m "feat: add recurring transaction queries and hooks (read-only)"
```

---

## Task 12: Settings Page

Replace the stub at `app/(app)/settings/page.tsx` with the full settings page.

- [ ] **Step 1: Write the settings page**

Sections (use a `<section>` with a label + content card pattern):

**Appearance**
- Theme: three-button toggle (Light / Dark / System) using `useTheme()` from `next-themes`

**Display**
- Default display currency: shadcn `<Select>` bound to `useDisplayCurrency()` context
  - Options: USD, IDR, EUR, SGD, GBP, JPY

**Privacy**
- Privacy mode: shadcn `<Switch>` bound to `usePrivacy().isPrivate` / `togglePrivacy`

**Data — Categories**
- Tab switcher: Expense | Income
- List all categories of selected type (via `useCategories(type)`)
- Each row:
  - Color dot + icon + name
  - Edit button → inline expand (same form fields as category-step: name input + icon grid + color picker)
  - Delete button (confirm via `window.confirm` or inline "Are you sure?" micro-state)
- "Add category" button at bottom → same inline form expand
- Disallow delete of `is_system = true` categories (show tooltip "System category cannot be deleted")

**Data — Recurring Transactions**
- List from `useRecurringTransactions()`
- Each row: type icon + amount + frequency + next_due_date + Delete button
- Empty state: "No recurring transactions"
- Note: Creating recurring transactions is done via the log form (Plan 5 scope)

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manual test**
  - Edit category name → confirm update appears in log form category list
  - Delete a custom category → confirm it disappears
  - Toggle theme/currency/privacy → reload → confirm all persist

- [ ] **Step 4: Commit**
```bash
git add app/(app)/settings/page.tsx
git commit -m "feat: build full settings page with appearance, display, privacy, and data management"
```

---

## Verification Checklist

```bash
npm test           # all existing tests still pass
npx tsc --noEmit   # zero TypeScript errors
npm run dev        # open http://localhost:3000
```

**Manual checks:**
- [ ] Create a monthly budget → log an expense in that category → progress bar reflects spend
- [ ] Exceed budget → progress bar turns red, shows over-budget amount
- [ ] Delete a budget → it disappears from the list
- [ ] Create a savings goal → tap "+ Contribute" → amount increases → ring updates
- [ ] Create goal linked to an account → account shows in linked account selector
- [ ] Hit 100% of a goal → ring is full
- [ ] `/goals` link appears in sidebar (desktop) and bottom nav (mobile)
- [ ] Settings: edit category name → updated in log form category picker
- [ ] Settings: delete custom category → gone from list and log form
- [ ] Settings: theme / display currency / privacy toggle → persists on reload
- [ ] Settings: recurring list shows any existing recurring transactions

**Deferred to Plan 5:**
- Creating recurring transactions via log form "Repeat" toggle
- Auto-tracking goal contributions from linked account income transactions
- Dashboard budget-vs-actual widget
- Financial Health Score
- Dashboard layout variants A/B/C
