# Moonlit Plan 2 — Accounts + Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Accounts CRUD, the multi-step Transaction Logger (`/log`), and full Transaction History so users can create accounts, log income/expense/transfer transactions, and review their history.

**Architecture:** Client-side TanStack Query for all reads (useQuery) and writes (useMutation) calling Supabase directly. A Postgres RPC function (`create_transaction_with_balance`) wraps transaction insert + account balance update atomically. The `/log` route moves inside `app/(app)/` to inherit QueryClientProvider, sidebar (desktop), and bottom nav (mobile) — the URL stays `/log` because route groups don't affect paths.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (`@supabase/ssr`), TanStack Query v5, shadcn/ui (`@base-ui/react`), Tailwind CSS v4, Zod v4, Lucide React, Vitest + React Testing Library.

---

## File Map

**New files:**
```
supabase/migrations/20260423000001_seed_and_functions.sql
lib/queries/accounts.ts
lib/queries/transactions.ts
lib/queries/categories.ts
lib/queries/exchange-rates.ts
lib/hooks/use-accounts.ts
lib/hooks/use-transactions.ts
lib/hooks/use-categories.ts
lib/hooks/use-exchange-rate.ts
components/accounts/account-card.tsx
components/accounts/account-form.tsx
components/transactions/transaction-item.tsx
components/transactions/transaction-list.tsx
components/transactions/transaction-filters.tsx
components/log/log-form.tsx
components/log/steps/type-step.tsx
components/log/steps/amount-step.tsx
components/log/steps/category-step.tsx
components/log/steps/account-step.tsx
components/log/steps/details-step.tsx
app/(app)/accounts/page.tsx
app/(app)/accounts/[id]/page.tsx
app/(app)/transactions/page.tsx
app/(app)/log/page.tsx          ← replaces app/log/page.tsx
__tests__/lib/queries/accounts.test.ts
__tests__/lib/queries/transactions.test.ts
__tests__/components/accounts/account-card.test.tsx
__tests__/components/log/log-form.test.tsx
```

**Modified files:**
```
lib/utils.ts                    ← add formatCurrency helper
app/log/page.tsx                ← delete (replaced by app/(app)/log/page.tsx)
```

---

## Task 1: DB Migration — Seed Exchange Rates + RPC Function

**Files:**
- Create: `supabase/migrations/20260423000001_seed_and_functions.sql`

No tests for raw SQL. Run it manually in Supabase SQL editor.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260423000001_seed_and_functions.sql

-- Seed initial exchange rates (updated by cron in Plan 4)
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES
  ('USD', 'IDR', 16000.00000000),
  ('IDR', 'USD', 0.00006250)
ON CONFLICT (from_currency, to_currency)
DO UPDATE SET rate = EXCLUDED.rate, fetched_at = now();

-- Atomic transaction creation + account balance update
-- Caller passes p_balance_delta (positive = credit, negative = debit)
CREATE OR REPLACE FUNCTION create_transaction_with_balance(
  p_account_id         UUID,
  p_type               TEXT,
  p_amount             NUMERIC,
  p_balance_delta      NUMERIC,
  p_currency           TEXT,
  p_converted_amount_usd NUMERIC,
  p_category_id        UUID,
  p_notes              TEXT,
  p_date               DATE,
  p_is_opening_balance BOOLEAN,
  p_transfer_pair_id   UUID,
  p_recurring_id       UUID
)
RETURNS SETOF transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO transactions (
    user_id, account_id, type, amount, currency, converted_amount_usd,
    category_id, notes, date, is_opening_balance, transfer_pair_id, recurring_id
  ) VALUES (
    auth.uid(), p_account_id, p_type, p_amount, p_currency, p_converted_amount_usd,
    p_category_id, p_notes, p_date, p_is_opening_balance, p_transfer_pair_id, p_recurring_id
  ) RETURNING id INTO v_id;

  UPDATE accounts
  SET balance = balance + p_balance_delta
  WHERE id = p_account_id AND user_id = auth.uid();

  RETURN QUERY SELECT * FROM transactions WHERE id = v_id;
END;
$$;
```

- [ ] **Step 2: Run in Supabase SQL editor**

Go to Supabase Dashboard → SQL editor → paste and run. Confirm no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260423000001_seed_and_functions.sql
git commit -m "feat: seed exchange rates and add create_transaction_with_balance rpc"
```

---

## Task 2: formatCurrency Utility

**Files:**
- Modify: `lib/utils.ts`

- [ ] **Step 1: Write the failing test**

Add to `__tests__/lib/utils.test.ts` (create file):

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });
  it("formats IDR without decimals", () => {
    expect(formatCurrency(1500000, "IDR")).toMatch(/1\.500\.000/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd "/Users/filbertfelim/Filbert Felim/Claude/moonlit"
npx vitest run __tests__/lib/utils.test.ts
```
Expected: FAIL — `formatCurrency is not a function`

- [ ] **Step 3: Add formatCurrency to lib/utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Currency } from "@/lib/types/database.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run __tests__/lib/utils.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts __tests__/lib/utils.test.ts
git commit -m "feat: add formatCurrency utility"
```

---

## Task 3: Account Query Functions

**Files:**
- Create: `lib/queries/accounts.ts`
- Test: `__tests__/lib/queries/accounts.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/queries/accounts.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccounts, getAccount, createAccount, updateAccount, archiveAccount } from "@/lib/queries/accounts";

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq }));
const mockEq = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq }));
const mockOrder = vi.fn(() => ({ data: [], error: null }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

beforeEach(() => vi.clearAllMocks());

describe("getAccounts", () => {
  it("returns active accounts ordered by created_at", async () => {
    const accounts = [{ id: "1", name: "BCA", is_archived: false }];
    mockOrder.mockResolvedValueOnce({ data: accounts, error: null });
    const result = await getAccounts();
    expect(result).toEqual(accounts);
    expect(mockFrom).toHaveBeenCalledWith("accounts");
  });

  it("throws on error", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error("db error") });
    await expect(getAccounts()).rejects.toThrow("db error");
  });
});

describe("archiveAccount", () => {
  it("sets is_archived true", async () => {
    mockEq.mockResolvedValueOnce({ error: null });
    await archiveAccount("abc");
    expect(mockUpdate).toHaveBeenCalledWith({ is_archived: true });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run __tests__/lib/queries/accounts.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement lib/queries/accounts.ts**

```typescript
import { createClient } from "@/lib/supabase/client";
import type { Account, AccountType, Currency } from "@/lib/types/database.types";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  color: string;
  icon: string;
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Account[];
}

export async function getAccount(id: string): Promise<Account> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Account;
}

export async function createAccount(
  input: CreateAccountInput,
  usdToIdrRate: number
): Promise<Account> {
  const supabase = createClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance: 0,
      color: input.color,
      icon: input.icon,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.initialBalance > 0) {
    const convertedUsd =
      input.currency === "USD"
        ? input.initialBalance
        : input.initialBalance / usdToIdrRate;
    const { error: txnError } = await supabase.rpc(
      "create_transaction_with_balance",
      {
        p_account_id: account.id,
        p_type: "income",
        p_amount: input.initialBalance,
        p_balance_delta: input.initialBalance,
        p_currency: input.currency,
        p_converted_amount_usd: convertedUsd,
        p_category_id: null,
        p_notes: "Opening balance",
        p_date: new Date().toISOString().split("T")[0],
        p_is_opening_balance: true,
        p_transfer_pair_id: null,
        p_recurring_id: null,
      }
    );
    if (txnError) throw txnError;
  }

  return getAccount(account.id);
}

export async function updateAccount(
  id: string,
  input: Partial<Omit<CreateAccountInput, "initialBalance">>
): Promise<Account> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Account;
}

export async function archiveAccount(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
npx vitest run __tests__/lib/queries/accounts.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/queries/accounts.ts __tests__/lib/queries/accounts.test.ts
git commit -m "feat: add account query functions"
```

---

## Task 4: Transaction Query Functions

**Files:**
- Create: `lib/queries/transactions.ts`
- Test: `__tests__/lib/queries/transactions.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/queries/transactions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTransactions, createTransaction, createTransfer, deleteTransaction } from "@/lib/queries/transactions";

const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ eq: mockEq, single: mockSingle, order: mockOrder }));
const mockOrder = vi.fn(() => ({ data: [], error: null }));
const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder }));
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect, delete: mockDelete }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

beforeEach(() => vi.clearAllMocks());

describe("getTransactions", () => {
  it("fetches transactions for an account", async () => {
    const txns = [{ id: "t1", account_id: "a1" }];
    mockOrder.mockResolvedValueOnce({ data: txns, error: null });
    const result = await getTransactions({ accountId: "a1" });
    expect(result).toEqual(txns);
  });
});

describe("createTransaction", () => {
  it("calls rpc with correct params", async () => {
    const txn = { id: "t1" };
    mockRpc.mockResolvedValueOnce({ data: [txn], error: null });
    const result = await createTransaction({
      account_id: "a1",
      type: "expense",
      amount: 100,
      balance_delta: -100,
      currency: "USD",
      converted_amount_usd: 100,
      category_id: "c1",
      notes: null,
      date: "2026-04-23",
    });
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transaction_with_balance",
      expect.objectContaining({ p_account_id: "a1", p_type: "expense" })
    );
    expect(result).toEqual(txn);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run __tests__/lib/queries/transactions.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement lib/queries/transactions.ts**

```typescript
import { createClient } from "@/lib/supabase/client";
import type { Transaction, TransactionType, Currency } from "@/lib/types/database.types";

export interface CreateTransactionInput {
  account_id: string;
  type: TransactionType;
  amount: number;
  balance_delta: number;
  currency: Currency;
  converted_amount_usd: number | null;
  category_id: string | null;
  notes: string | null;
  date: string;
  is_opening_balance?: boolean;
  transfer_pair_id?: string | null;
  recurring_id?: string | null;
}

export interface GetTransactionsOptions {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export async function getTransactions(
  options: GetTransactionsOptions = {}
): Promise<Transaction[]> {
  const supabase = createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.accountId) query = query.eq("account_id", options.accountId);
  if (options.type) query = query.eq("type", options.type);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.dateFrom) query = query.gte("date", options.dateFrom);
  if (options.dateTo) query = query.lte("date", options.dateTo);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Transaction[];
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_transaction_with_balance", {
    p_account_id: input.account_id,
    p_type: input.type,
    p_amount: input.amount,
    p_balance_delta: input.balance_delta,
    p_currency: input.currency,
    p_converted_amount_usd: input.converted_amount_usd,
    p_category_id: input.category_id,
    p_notes: input.notes,
    p_date: input.date,
    p_is_opening_balance: input.is_opening_balance ?? false,
    p_transfer_pair_id: input.transfer_pair_id ?? null,
    p_recurring_id: input.recurring_id ?? null,
  });
  if (error) throw error;
  return (data as Transaction[])[0];
}

export async function createTransfer(params: {
  sourceAccountId: string;
  destAccountId: string;
  amount: number;
  sourceCurrency: Currency;
  destCurrency: Currency;
  destAmount: number; // amount received in dest currency
  usdToIdrRate: number;
  notes: string | null;
  date: string;
}): Promise<{ debit: Transaction; credit: Transaction }> {
  const transferPairId = crypto.randomUUID();

  const sourceConvertedUsd =
    params.sourceCurrency === "USD"
      ? params.amount
      : params.amount / params.usdToIdrRate;

  const debit = await createTransaction({
    account_id: params.sourceAccountId,
    type: "transfer",
    amount: params.amount,
    balance_delta: -params.amount,
    currency: params.sourceCurrency,
    converted_amount_usd: sourceConvertedUsd,
    category_id: null,
    notes: params.notes,
    date: params.date,
    transfer_pair_id: transferPairId,
  });

  const destConvertedUsd =
    params.destCurrency === "USD"
      ? params.destAmount
      : params.destAmount / params.usdToIdrRate;

  const credit = await createTransaction({
    account_id: params.destAccountId,
    type: "transfer",
    amount: params.destAmount,
    balance_delta: params.destAmount,
    currency: params.destCurrency,
    converted_amount_usd: destConvertedUsd,
    category_id: null,
    notes: params.notes,
    date: params.date,
    transfer_pair_id: transferPairId,
  });

  return { debit, credit };
}

export async function deleteTransaction(id: string): Promise<void> {
  // Note: deleting a transaction does NOT automatically update account balance.
  // For Plan 2, deletes are disabled in the UI for non-opening-balance transactions.
  // Full delete with balance revert is a Plan 3 enhancement.
  const supabase = createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
npx vitest run __tests__/lib/queries/transactions.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/queries/transactions.ts __tests__/lib/queries/transactions.test.ts
git commit -m "feat: add transaction query functions"
```

---

## Task 5: Category + Exchange Rate Query Functions

**Files:**
- Create: `lib/queries/categories.ts`
- Create: `lib/queries/exchange-rates.ts`

No dedicated tests (simple passthrough queries, covered by integration tests).

- [ ] **Step 1: Implement lib/queries/categories.ts**

```typescript
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryType } from "@/lib/types/database.types";

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}
```

- [ ] **Step 2: Implement lib/queries/exchange-rates.ts**

```typescript
import { createClient } from "@/lib/supabase/client";

export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("from_currency", from)
    .eq("to_currency", to)
    .single();
  if (error || !data) return from === "USD" && to === "IDR" ? 16000 : 0.0000625;
  return Number(data.rate);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/queries/categories.ts lib/queries/exchange-rates.ts
git commit -m "feat: add category and exchange rate query functions"
```

---

## Task 6: TanStack Query Hooks

**Files:**
- Create: `lib/hooks/use-accounts.ts`
- Create: `lib/hooks/use-transactions.ts`
- Create: `lib/hooks/use-categories.ts`
- Create: `lib/hooks/use-exchange-rate.ts`

- [ ] **Step 1: Implement lib/hooks/use-exchange-rate.ts**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getExchangeRate } from "@/lib/queries/exchange-rates";

export function useExchangeRate(from: string, to: string) {
  return useQuery({
    queryKey: ["exchange-rate", from, to],
    queryFn: () => getExchangeRate(from, to),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/** Returns USD→IDR rate (e.g. 16000), defaulting to 16000 while loading */
export function useUsdToIdr(): number {
  const { data } = useExchangeRate("USD", "IDR");
  return data ?? 16000;
}
```

- [ ] **Step 2: Implement lib/hooks/use-accounts.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
  type CreateAccountInput,
} from "@/lib/queries/accounts";
import { useUsdToIdr } from "./use-exchange-rate";

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
  const usdToIdr = useUsdToIdr();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input, usdToIdr),
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
```

- [ ] **Step 3: Implement lib/hooks/use-transactions.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  createTransaction,
  createTransfer,
  type CreateTransactionInput,
  type GetTransactionsOptions,
} from "@/lib/queries/transactions";
import { useUsdToIdr } from "./use-exchange-rate";
import type { Currency } from "@/lib/types/database.types";

export function useTransactions(options: GetTransactionsOptions = {}) {
  return useQuery({
    queryKey: ["transactions", options],
    queryFn: () => getTransactions(options),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const usdToIdr = useUsdToIdr();
  return useMutation({
    mutationFn: (
      input: Omit<CreateTransactionInput, "converted_amount_usd"> & {
        currency: Currency;
      }
    ) => {
      const convertedUsd =
        input.currency === "USD" ? input.amount : input.amount / usdToIdr;
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
  const usdToIdr = useUsdToIdr();
  return useMutation({
    mutationFn: (params: {
      sourceAccountId: string;
      destAccountId: string;
      amount: number;
      sourceCurrency: Currency;
      destCurrency: Currency;
      destAmount: number;
      notes: string | null;
      date: string;
    }) => createTransfer({ ...params, usdToIdrRate: usdToIdr }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
```

- [ ] **Step 4: Implement lib/hooks/use-categories.ts**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/
git commit -m "feat: add TanStack Query hooks for accounts, transactions, categories, exchange rates"
```

---

## Task 7: Account Card + Account Form

**Files:**
- Create: `components/accounts/account-card.tsx`
- Create: `components/accounts/account-form.tsx`
- Test: `__tests__/components/accounts/account-card.test.tsx`

- [ ] **Step 1: Write failing test for AccountCard**

```typescript
// __tests__/components/accounts/account-card.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountCard } from "@/components/accounts/account-card";
import type { Account } from "@/lib/types/database.types";

const mockAccount: Account = {
  id: "1",
  user_id: "u1",
  name: "BCA Savings",
  type: "savings",
  currency: "IDR",
  balance: 5000000,
  color: "#22c55e",
  icon: "wallet",
  is_archived: false,
  created_at: "2026-04-23T00:00:00Z",
};

describe("AccountCard", () => {
  it("renders account name and formatted balance", () => {
    render(<AccountCard account={mockAccount} onEdit={vi.fn()} onArchive={vi.fn()} />);
    expect(screen.getByText("BCA Savings")).toBeInTheDocument();
    expect(screen.getByText(/5\.000\.000/)).toBeInTheDocument();
  });

  it("calls onEdit when edit is clicked", async () => {
    const onEdit = vi.fn();
    render(<AccountCard account={mockAccount} onEdit={onEdit} onArchive={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /more/i }));
    await userEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run __tests__/components/accounts/account-card.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement components/accounts/account-card.tsx**

```tsx
"use client";

import {
  Wallet, Briefcase, CreditCard, Smartphone, Building2, MoreHorizontal,
  Landmark, PiggyBank, DollarSign, BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types/database.types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  wallet: Wallet,
  briefcase: Briefcase,
  "credit-card": CreditCard,
  smartphone: Smartphone,
  building: Building2,
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  dollar: DollarSign,
  badge: BadgeDollarSign,
};

function AccountIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Wallet;
  return <Icon className={className} />;
}

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onArchive: () => void;
}

export function AccountCard({ account, onEdit, onArchive }: AccountCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: account.color + "22" }}
          >
            <AccountIcon
              name={account.icon}
              className="h-4 w-4"
              style={{ color: account.color } as React.CSSProperties}
            />
          </div>
          <div>
            <p className="font-medium text-sm leading-tight">{account.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1" aria-label="more">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onArchive} className="text-destructive">
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
        <p className="text-2xl font-semibold tabular-nums">
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement components/accounts/account-form.tsx**

This is a dialog that creates or edits an account. It uses the `useCreateAccount` / `useUpdateAccount` hooks.

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateAccount, useUpdateAccount } from "@/lib/hooks/use-accounts";
import type { Account } from "@/lib/types/database.types";

const ACCOUNT_COLORS = [
  "#6366f1", "#22c55e", "#ef4444", "#f97316",
  "#eab308", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#64748b",
];

const ACCOUNT_ICONS = [
  { value: "wallet", label: "Wallet" },
  { value: "credit-card", label: "Card" },
  { value: "building", label: "Bank" },
  { value: "smartphone", label: "E-Wallet" },
  { value: "landmark", label: "Landmark" },
  { value: "piggy-bank", label: "Piggy Bank" },
];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["checking", "savings", "cash", "ewallet"]),
  currency: z.enum(["USD", "IDR"]),
  initialBalance: z.coerce.number().min(0, "Balance must be 0 or more"),
  color: z.string(),
  icon: z.string(),
});

type Values = z.infer<typeof schema>;

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  account?: Account; // if provided, edit mode
}

export function AccountForm({ open, onClose, account }: AccountFormProps) {
  const isEdit = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "checking",
      currency: "IDR",
      initialBalance: 0,
      color: "#6366f1",
      icon: "wallet",
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: account.balance,
        color: account.color,
        icon: account.icon,
      });
    } else {
      form.reset({
        name: "", type: "checking", currency: "IDR",
        initialBalance: 0, color: "#6366f1", icon: "wallet",
      });
    }
  }, [account, open]);

  async function onSubmit(values: Values) {
    if (isEdit) {
      await updateAccount.mutateAsync({
        id: account!.id,
        data: { name: values.name, type: values.type, color: values.color, icon: values.icon },
      });
    } else {
      await createAccount.mutateAsync({
        name: values.name,
        type: values.type,
        currency: values.currency,
        initialBalance: values.initialBalance,
        color: values.color,
        icon: values.icon,
      });
    }
    onClose();
  }

  const pending = createAccount.isPending || updateAccount.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="BCA Savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="ewallet">E-Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IDR">IDR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!isEdit && (
              <FormField
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial balance</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {ACCOUNT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: field.value === c ? "white" : "transparent",
                          outlineOffset: "2px",
                          outline: field.value === c ? `2px solid ${c}` : "none",
                        }}
                        onClick={() => field.onChange(c)}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {ACCOUNT_ICONS.map((i) => (
                      <button
                        key={i.value}
                        type="button"
                        className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                          field.value === i.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => field.onChange(i.value)}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(createAccount.error || updateAccount.error) && (
              <p className="text-sm text-destructive">
                {(createAccount.error || updateAccount.error)?.message}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

The `Select` component is not yet in the UI library. Add it:

```bash
npx shadcn@latest add select
```

Also add `Dialog`:

```bash
npx shadcn@latest add dialog
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run __tests__/components/accounts/account-card.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/accounts/ __tests__/components/accounts/
git commit -m "feat: add AccountCard and AccountForm components"
```

---

## Task 8: Accounts Page

**Files:**
- Create: `app/(app)/accounts/page.tsx`

- [ ] **Step 1: Implement app/(app)/accounts/page.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { useAccounts, useArchiveAccount } from "@/lib/hooks/use-accounts";
import type { Account } from "@/lib/types/database.types";

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const archiveAccount = useArchiveAccount();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditTarget(account);
    setFormOpen(true);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add account
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && accounts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No accounts yet.</p>
          <Button variant="link" size="sm" onClick={openCreate}>
            Add your first account
          </Button>
        </div>
      )}

      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`} className="block">
              <AccountCard
                account={account}
                onEdit={(e) => {
                  e?.stopPropagation?.();
                  openEdit(account);
                }}
                onArchive={(e) => {
                  e?.stopPropagation?.();
                  archiveAccount.mutate(account.id);
                }}
              />
            </Link>
          ))}
        </div>
      )}

      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        account={editTarget}
      />
    </div>
  );
}
```

Note: Update `AccountCard`'s `onEdit` and `onArchive` prop types to accept an optional event:

In `components/accounts/account-card.tsx`, change:
```tsx
interface AccountCardProps {
  account: Account;
  onEdit: (e?: React.MouseEvent) => void;
  onArchive: (e?: React.MouseEvent) => void;
}
```

And update the DropdownMenuItems:
```tsx
<DropdownMenuItem onSelect={() => onEdit()}>Edit</DropdownMenuItem>
<DropdownMenuItem onSelect={() => onArchive()} className="text-destructive">
  Archive
</DropdownMenuItem>
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/accounts/page.tsx
git commit -m "feat: add accounts list page"
```

---

## Task 9: Transaction Item + List + Filters

**Files:**
- Create: `components/transactions/transaction-item.tsx`
- Create: `components/transactions/transaction-filters.tsx`
- Create: `components/transactions/transaction-list.tsx`

- [ ] **Step 1: Implement components/transactions/transaction-item.tsx**

```tsx
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/types/database.types";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
}

export function TransactionItem({ transaction, category }: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isIncome
            ? "bg-green-500/10 text-green-600"
            : isTransfer
            ? "bg-blue-500/10 text-blue-600"
            : "bg-red-500/10 text-red-600"
        )}
      >
        {isIncome ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : isTransfer ? (
          <ArrowLeftRight className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {transaction.is_opening_balance
            ? "Opening balance"
            : isTransfer
            ? "Transfer"
            : (category?.name ?? "Uncategorized")}
        </p>
        {transaction.notes && (
          <p className="text-xs text-muted-foreground truncate">{transaction.notes}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            isIncome ? "text-green-600" : isTransfer ? "" : "text-red-600"
          )}
        >
          {isIncome ? "+" : isTransfer ? "" : "−"}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(transaction.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement components/transactions/transaction-filters.tsx**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { TransactionType } from "@/lib/types/database.types";

export interface TransactionFiltersState {
  type: TransactionType | "all";
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  function update(patch: Partial<TransactionFiltersState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search notes…"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="h-8 w-40 text-sm"
      />
      <Select
        value={filters.type}
        onValueChange={(v) => update({ type: v as TransactionType | "all" })}
      >
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => update({ dateFrom: e.target.value })}
        className="h-8 w-36 text-sm"
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => update({ dateTo: e.target.value })}
        className="h-8 w-36 text-sm"
        aria-label="To date"
      />
    </div>
  );
}
```

- [ ] **Step 3: Implement components/transactions/transaction-list.tsx**

```tsx
"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { TransactionItem } from "./transaction-item";
import {
  TransactionFilters,
  type TransactionFiltersState,
} from "./transaction-filters";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useCategories } from "@/lib/hooks/use-categories";
import type { GetTransactionsOptions } from "@/lib/queries/transactions";

interface TransactionListProps {
  baseOptions?: GetTransactionsOptions; // e.g. { accountId: "abc" } for account detail page
  showFilters?: boolean;
}

const DEFAULT_FILTERS: TransactionFiltersState = {
  type: "all",
  dateFrom: "",
  dateTo: "",
  search: "",
};

export function TransactionList({
  baseOptions = {},
  showFilters = true,
}: TransactionListProps) {
  const [filters, setFilters] = useState<TransactionFiltersState>(DEFAULT_FILTERS);

  const queryOptions: GetTransactionsOptions = {
    ...baseOptions,
    type: filters.type !== "all" ? filters.type : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const { data: transactions = [], isLoading } = useTransactions(queryOptions);
  const { data: categories = [] } = useCategories();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = filters.search
    ? transactions.filter((t) =>
        t.notes?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-3">
      {showFilters && (
        <TransactionFilters filters={filters} onChange={setFilters} />
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No transactions found.
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="divide-y divide-border">
          {filtered.map((txn) => (
            <TransactionItem
              key={txn.id}
              transaction={txn}
              category={txn.category_id ? categoryMap[txn.category_id] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/transactions/
git commit -m "feat: add TransactionItem, TransactionFilters, TransactionList components"
```

---

## Task 10: Transactions Page + Account Detail Page

**Files:**
- Create: `app/(app)/transactions/page.tsx`
- Create: `app/(app)/accounts/[id]/page.tsx`

- [ ] **Step 1: Implement app/(app)/transactions/page.tsx**

```tsx
import { TransactionList } from "@/components/transactions/transaction-list";

export default function TransactionsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <TransactionList showFilters />
    </div>
  );
}
```

- [ ] **Step 2: Implement app/(app)/accounts/[id]/page.tsx**

```tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useAccount } from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: account, isLoading } = useAccount(id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {isLoading ? (
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold">{account?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {account
                ? formatCurrency(account.balance, account.currency)
                : ""}
            </p>
          </div>
        )}
      </div>

      <TransactionList
        baseOptions={{ accountId: id }}
        showFilters
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/transactions/page.tsx" "app/(app)/accounts/[id]/page.tsx"
git commit -m "feat: add transactions page and account detail page"
```

---

## Task 11: Log Form Shell + Type Step + Amount Step

**Files:**
- Create: `components/log/log-form.tsx`
- Create: `components/log/steps/type-step.tsx`
- Create: `components/log/steps/amount-step.tsx`
- Test: `__tests__/components/log/log-form.test.tsx`

The log form is a stepped flow driven by local state. Steps for income/expense:
`type → amount → category → account → details → submit`

Steps for transfer:
`type → amount → account (source + dest) → details → submit`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/log/log-form.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogForm } from "@/components/log/log-form";

vi.mock("@/lib/hooks/use-accounts", () => ({
  useAccounts: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/lib/hooks/use-categories", () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/lib/hooks/use-transactions", () => ({
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateTransfer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/hooks/use-exchange-rate", () => ({
  useUsdToIdr: () => 16000,
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("LogForm", () => {
  it("starts on the type step", () => {
    render(<Wrapper><LogForm /></Wrapper>);
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });

  it("advances to amount step after selecting Expense", async () => {
    render(<Wrapper><LogForm /></Wrapper>);
    await userEvent.click(screen.getByText("Expense"));
    expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
  });

  it("can go back from amount step", async () => {
    render(<Wrapper><LogForm /></Wrapper>);
    await userEvent.click(screen.getByText("Income"));
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Expense")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run __tests__/components/log/log-form.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement components/log/steps/type-step.tsx**

```tsx
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types/database.types";

interface TypeStepProps {
  onSelect: (type: TransactionType) => void;
}

const TYPES = [
  { value: "expense" as const, label: "Expense", icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-500/10 hover:bg-red-500/20" },
  { value: "income" as const, label: "Income", icon: ArrowDownLeft, color: "text-green-500", bg: "bg-green-500/10 hover:bg-green-500/20" },
  { value: "transfer" as const, label: "Transfer", icon: ArrowLeftRight, color: "text-blue-500", bg: "bg-blue-500/10 hover:bg-blue-500/20" },
];

export function TypeStep({ onSelect }: TypeStepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-center">What type?</h2>
      <div className="grid grid-cols-3 gap-3">
        {TYPES.map(({ value, label, icon: Icon, color, bg }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-5 transition-colors",
              bg
            )}
          >
            <Icon className={cn("h-6 w-6", color)} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement components/log/steps/amount-step.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Currency } from "@/lib/types/database.types";

interface AmountStepProps {
  amount: string;
  currency: Currency;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onNext: () => void;
}

export function AmountStep({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  onNext,
}: AmountStepProps) {
  const numericAmount = parseFloat(amount) || 0;

  function handleKey(key: string) {
    if (key === "⌫") {
      onAmountChange(amount.slice(0, -1) || "");
      return;
    }
    if (key === "." && amount.includes(".")) return;
    if (amount === "0" && key !== ".") {
      onAmountChange(key);
      return;
    }
    onAmountChange((amount || "") + key);
  }

  const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
            <SelectTrigger className="w-20 h-8 text-sm border-0 bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">IDR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-4xl font-semibold tabular-nums min-w-[4ch]">
            {amount || "0"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            className="h-14 rounded-xl bg-muted hover:bg-muted/70 text-lg font-medium transition-colors"
          >
            {k}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        disabled={numericAmount <= 0}
        onClick={onNext}
      >
        Continue
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Implement components/log/log-form.tsx (shell only — full wiring in Task 13)**

```tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeStep } from "./steps/type-step";
import { AmountStep } from "./steps/amount-step";
import { CategoryStep } from "./steps/category-step";
import { AccountStep } from "./steps/account-step";
import { DetailsStep } from "./steps/details-step";
import type { TransactionType, Currency, RecurringFrequency } from "@/lib/types/database.types";

type LogStep = "type" | "amount" | "category" | "account" | "details";

interface LogState {
  type: TransactionType;
  amount: string;
  currency: Currency;
  categoryId: string | null;
  accountId: string | null;
  sourceAccountId: string | null;
  destAccountId: string | null;
  destAmount: string;
  date: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
}

const INITIAL_STATE: LogState = {
  type: "expense",
  amount: "",
  currency: "IDR",
  categoryId: null,
  accountId: null,
  sourceAccountId: null,
  destAccountId: null,
  destAmount: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  isRecurring: false,
  recurringFrequency: "monthly",
};

function getStepsForType(type: TransactionType): LogStep[] {
  if (type === "transfer") return ["type", "amount", "account", "details"];
  return ["type", "amount", "category", "account", "details"];
}

export function LogForm() {
  const [step, setStep] = useState<LogStep>("type");
  const [state, setState] = useState<LogState>(INITIAL_STATE);

  function update(patch: Partial<LogState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function next() {
    const steps = getStepsForType(state.type);
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }

  function back() {
    const steps = getStepsForType(state.type);
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }

  function reset() {
    setState(INITIAL_STATE);
    setStep("type");
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {step !== "type" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={back}
          aria-label="back"
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}

      {step === "type" && (
        <TypeStep
          onSelect={(type) => {
            update({ type });
            next();
            // After setting type, manually advance because state update is async
            const steps = getStepsForType(type);
            setStep(steps[1]);
          }}
        />
      )}

      {step === "amount" && (
        <AmountStep
          amount={state.amount}
          currency={state.currency}
          onAmountChange={(amount) => update({ amount })}
          onCurrencyChange={(currency) => update({ currency })}
          onNext={next}
        />
      )}

      {step === "category" && (
        <CategoryStep
          type={state.type === "income" ? "income" : "expense"}
          selectedId={state.categoryId}
          onSelect={(categoryId) => { update({ categoryId }); next(); }}
        />
      )}

      {step === "account" && (
        <AccountStep
          transactionType={state.type}
          accountId={state.accountId}
          sourceAccountId={state.sourceAccountId}
          destAccountId={state.destAccountId}
          destAmount={state.destAmount}
          sourceCurrency={state.currency}
          onAccountSelect={(accountId) => { update({ accountId }); next(); }}
          onTransferSelect={(sourceAccountId, destAccountId, destAmount) => {
            update({ sourceAccountId, destAccountId, destAmount });
            next();
          }}
        />
      )}

      {step === "details" && (
        <DetailsStep
          state={state}
          update={update}
          onSubmit={reset}
        />
      )}
    </div>
  );
}
```

Note: `CategoryStep`, `AccountStep`, `DetailsStep` are stub imports — implemented in the next two tasks.

- [ ] **Step 6: Run tests**

```bash
npx vitest run __tests__/components/log/log-form.test.tsx
```
Expected: PASS (with stubs in place)

- [ ] **Step 7: Commit**

```bash
git add components/log/ __tests__/components/log/
git commit -m "feat: add log form shell, TypeStep, and AmountStep"
```

---

## Task 12: Category Step + Account Step

**Files:**
- Create: `components/log/steps/category-step.tsx`
- Create: `components/log/steps/account-step.tsx`

- [ ] **Step 1: Implement components/log/steps/category-step.tsx**

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
}

export function CategoryStep({ type, selectedId, onSelect }: CategoryStepProps) {
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
    onSelect(cat.id);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Category</h2>

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding(false)}
            >
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
```

- [ ] **Step 2: Implement components/log/steps/account-step.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatCurrency, cn } from "@/lib/utils";
import type { TransactionType, Currency } from "@/lib/types/database.types";

interface AccountStepProps {
  transactionType: TransactionType;
  accountId: string | null;
  sourceAccountId: string | null;
  destAccountId: string | null;
  destAmount: string;
  sourceCurrency: Currency;
  onAccountSelect: (accountId: string) => void;
  onTransferSelect: (
    sourceAccountId: string,
    destAccountId: string,
    destAmount: string
  ) => void;
}

export function AccountStep({
  transactionType,
  accountId,
  sourceAccountId,
  destAccountId,
  destAmount,
  sourceCurrency,
  onAccountSelect,
  onTransferSelect,
}: AccountStepProps) {
  const { data: accounts = [] } = useAccounts();
  const [localSource, setLocalSource] = useState(sourceAccountId ?? "");
  const [localDest, setLocalDest] = useState(destAccountId ?? "");
  const [localDestAmount, setLocalDestAmount] = useState(destAmount);

  if (transactionType !== "transfer") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center">Account</h2>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => onAccountSelect(acc.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border p-3 transition-colors",
                accountId === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{acc.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
              </div>
              <p className="text-sm font-medium tabular-nums">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Transfer: source + dest + optional dest amount for cross-currency
  const sourceAcc = accounts.find((a) => a.id === localSource);
  const destAcc = accounts.find((a) => a.id === localDest);
  const isCrossCurrency = sourceAcc && destAcc && sourceAcc.currency !== destAcc.currency;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Transfer accounts</h2>

      <div>
        <p className="text-xs text-muted-foreground mb-2">From</p>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              disabled={localDest === acc.id}
              onClick={() => setLocalSource(acc.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border p-3 transition-colors disabled:opacity-40",
                localSource === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <p className="text-sm font-medium">{acc.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">To</p>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              disabled={localSource === acc.id}
              onClick={() => setLocalDest(acc.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border p-3 transition-colors disabled:opacity-40",
                localDest === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <p className="text-sm font-medium">{acc.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {isCrossCurrency && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Amount received ({destAcc.currency})
          </p>
          <Input
            type="number"
            min="0"
            step="any"
            value={localDestAmount}
            onChange={(e) => setLocalDestAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      )}

      <Button
        className="w-full"
        disabled={!localSource || !localDest || localSource === localDest}
        onClick={() =>
          onTransferSelect(
            localSource,
            localDest,
            isCrossCurrency ? localDestAmount : ""
          )
        }
      >
        Continue
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/log/steps/category-step.tsx components/log/steps/account-step.tsx
git commit -m "feat: add CategoryStep and AccountStep for log form"
```

---

## Task 13: Details Step + Full Log Form Wiring

**Files:**
- Create: `components/log/steps/details-step.tsx`
- Modify: `components/log/log-form.tsx` (add submission logic)

- [ ] **Step 1: Implement components/log/steps/details-step.tsx**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { RecurringFrequency } from "@/lib/types/database.types";

// Add Textarea to shadcn if not present: npx shadcn@latest add textarea

interface DetailsState {
  date: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
}

interface DetailsStepProps {
  state: DetailsState;
  update: (patch: Partial<DetailsState>) => void;
  onSubmit: () => void;
  isPending?: boolean;
}

export function DetailsStep({ state, update, onSubmit, isPending }: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Details</h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium block mb-1">Date</label>
          <Input
            type="date"
            value={state.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Notes (optional)</label>
          <Textarea
            placeholder="Add a note…"
            value={state.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={state.isRecurring}
            onClick={() => update({ isRecurring: !state.isRecurring })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.isRecurring ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.isRecurring ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <label className="text-sm font-medium">Repeat</label>
        </div>

        {state.isRecurring && (
          <Select
            value={state.recurringFrequency}
            onValueChange={(v) => update({ recurringFrequency: v as RecurringFrequency })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={isPending}>
        {isPending ? "Saving…" : "Save transaction"}
      </Button>
    </div>
  );
}
```

Add Textarea component:
```bash
npx shadcn@latest add textarea
```

- [ ] **Step 2: Wire submission into log-form.tsx**

Replace the `DetailsStep` usage in `components/log/log-form.tsx` with the following updated block. The key addition is calling `useCreateTransaction` / `useCreateTransfer` + creating a recurring template if needed:

```tsx
// Add these imports at the top of log-form.tsx:
import { toast } from "sonner";
import { useCreateTransaction, useCreateTransfer } from "@/lib/hooks/use-transactions";
import { useUsdToIdr } from "@/lib/hooks/use-exchange-rate";
import { createClient } from "@/lib/supabase/client";
import { useAccounts } from "@/lib/hooks/use-accounts";

// Add inside LogForm component, after the useState declarations:
const createTransaction = useCreateTransaction();
const createTransfer = useCreateTransfer();
const usdToIdr = useUsdToIdr();
const { data: accounts = [] } = useAccounts();

async function handleSubmit() {
  try {
    const amount = parseFloat(state.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (state.type === "transfer") {
      const sourceAcc = accounts.find((a) => a.id === state.sourceAccountId);
      const destAcc = accounts.find((a) => a.id === state.destAccountId);
      if (!sourceAcc || !destAcc) return;
      const destAmount = state.destAmount
        ? parseFloat(state.destAmount)
        : sourceAcc.currency === destAcc.currency
        ? amount
        : sourceAcc.currency === "USD"
        ? amount * usdToIdr
        : amount / usdToIdr;

      await createTransfer.mutateAsync({
        sourceAccountId: sourceAcc.id,
        destAccountId: destAcc.id,
        amount,
        sourceCurrency: sourceAcc.currency,
        destCurrency: destAcc.currency,
        destAmount,
        notes: state.notes || null,
        date: state.date,
      });
    } else {
      if (!state.accountId) return;
      const balanceDelta = state.type === "income" ? amount : -amount;
      const txn = await createTransaction.mutateAsync({
        account_id: state.accountId,
        type: state.type,
        amount,
        balance_delta: balanceDelta,
        currency: state.currency,
        category_id: state.categoryId,
        notes: state.notes || null,
        date: state.date,
      });

      if (state.isRecurring) {
        const supabase = createClient();
        const nextDue = new Date(state.date);
        if (state.recurringFrequency === "daily") nextDue.setDate(nextDue.getDate() + 1);
        else if (state.recurringFrequency === "weekly") nextDue.setDate(nextDue.getDate() + 7);
        else if (state.recurringFrequency === "monthly") nextDue.setMonth(nextDue.getMonth() + 1);
        else nextDue.setFullYear(nextDue.getFullYear() + 1);

        await supabase.from("recurring_transactions").insert({
          transaction_template: {
            account_id: state.accountId,
            type: state.type,
            amount,
            currency: state.currency,
            category_id: state.categoryId,
            notes: state.notes || null,
          },
          frequency: state.recurringFrequency,
          next_due_date: nextDue.toISOString().split("T")[0],
        });
      }
    }

    toast.success("Transaction saved");
    reset();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to save transaction");
  }
}

// Replace the DetailsStep rendering inside the JSX:
{step === "details" && (
  <DetailsStep
    state={state}
    update={update}
    onSubmit={handleSubmit}
    isPending={createTransaction.isPending || createTransfer.isPending}
  />
)}
```

Also ensure the root layout has a Sonner `<Toaster />`. Check `app/(app)/layout.tsx` or `app/layout.tsx` and add if missing:

```tsx
import { Toaster } from "@/components/ui/sonner";
// ... inside the JSX after ThemeProvider children:
<Toaster />
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```
Expected: all passing

- [ ] **Step 4: Commit**

```bash
git add components/log/steps/details-step.tsx components/log/log-form.tsx
git commit -m "feat: add DetailsStep and wire full log form submission"
```

---

## Task 14: Log Page

**Files:**
- Delete: `app/log/page.tsx`
- Create: `app/(app)/log/page.tsx`

The log page moves inside the `(app)` route group so it gets the QueryClientProvider and sidebar layout. The URL remains `/log` (route groups are path-transparent).

- [ ] **Step 1: Delete the old placeholder**

```bash
rm "app/log/page.tsx"
rmdir "app/log" 2>/dev/null || true
```

- [ ] **Step 2: Create app/(app)/log/page.tsx**

```tsx
import { LogForm } from "@/components/log/log-form";

export default function LogPage() {
  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center mb-6">Log transaction</h1>
        <LogForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
npm run build   # confirm no TypeScript errors
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/log/page.tsx"
git rm "app/log/page.tsx"
git commit -m "feat: replace log placeholder with full multi-step LogForm"
```

---

---

## Task 15: Split Transactions in Log Form

Split lets the user divide one total amount across multiple categories, creating one transaction row per split. Each split row calls `create_transaction_with_balance` with its portion of the amount — the balance decreases by each split amount, so the total account change equals the sum of all splits.

**Files:**
- Create: `components/log/steps/split-category-step.tsx`
- Modify: `components/log/steps/category-step.tsx` (add Split toggle)
- Modify: `components/log/log-form.tsx` (handle split state + split submission)

- [ ] **Step 1: Add split state to LogState in log-form.tsx**

Add to the `LogState` interface and `INITIAL_STATE` in `components/log/log-form.tsx`:

```typescript
// In LogState interface, add:
isSplit: boolean;
splits: Array<{ categoryId: string | null; amount: string }>;

// In INITIAL_STATE, add:
isSplit: false,
splits: [],
```

- [ ] **Step 2: Create components/log/steps/split-category-step.tsx**

```tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/hooks/use-categories";
import { formatCurrency, cn } from "@/lib/utils";
import type { CategoryType, Currency } from "@/lib/types/database.types";

interface Split {
  categoryId: string | null;
  amount: string;
}

interface SplitCategoryStepProps {
  totalAmount: number;
  currency: Currency;
  categoryType: CategoryType;
  splits: Split[];
  onSplitsChange: (splits: Split[]) => void;
  onNext: () => void;
}

export function SplitCategoryStep({
  totalAmount,
  currency,
  categoryType,
  splits,
  onSplitsChange,
  onNext,
}: SplitCategoryStepProps) {
  const { data: categories = [] } = useCategories(categoryType);

  const allocatedTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const remaining = totalAmount - allocatedTotal;
  const isBalanced = Math.abs(remaining) < 0.01;

  function addSplit() {
    onSplitsChange([...splits, { categoryId: null, amount: "" }]);
  }

  function updateSplit(index: number, patch: Partial<Split>) {
    const next = splits.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onSplitsChange(next);
  }

  function removeSplit(index: number) {
    onSplitsChange(splits.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Split</h2>
        <div className={cn("text-sm tabular-nums", isBalanced ? "text-green-600" : "text-destructive")}>
          {isBalanced
            ? "Balanced"
            : `${remaining > 0 ? "+" : ""}${formatCurrency(remaining, currency)} left`}
        </div>
      </div>

      <div className="space-y-3">
        {splits.map((split, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <select
                value={split.categoryId ?? ""}
                onChange={(e) => updateSplit(i, { categoryId: e.target.value || null })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Amount"
                value={split.amount}
                onChange={(e) => updateSplit(i, { amount: e.target.value })}
                className="h-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 mt-0.5 shrink-0"
              onClick={() => removeSplit(i)}
              disabled={splits.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addSplit} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add split
      </Button>

      <Button className="w-full" disabled={!isBalanced || splits.some((s) => !s.categoryId)} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Add Split toggle to category-step.tsx**

At the top of `CategoryStep`, before the categories grid, add:

```tsx
// Import at top:
import { Scissors } from "lucide-react";

// Add prop:
interface CategoryStepProps {
  type: CategoryType;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSplitMode: () => void; // called when user taps Split
}

// Add button before categories grid:
<div className="flex justify-end">
  <Button variant="ghost" size="sm" onClick={onSplitMode} className="text-xs gap-1">
    <Scissors className="h-3.5 w-3.5" />
    Split
  </Button>
</div>
```

- [ ] **Step 4: Handle split mode in log-form.tsx**

In `LogForm`, add a `splitMode` boolean state. When `onSplitMode` is called from `CategoryStep`:
1. Set `splitMode = true`
2. Initialize `splits` to two empty entries: `[{ categoryId: null, amount: "" }, { categoryId: null, amount: "" }]`
3. Render `SplitCategoryStep` instead of `CategoryStep` when `splitMode && step === "category"`

```tsx
// Add to LogForm state:
const [splitMode, setSplitMode] = useState(false);

// In the "category" step rendering block:
{step === "category" && !splitMode && (
  <CategoryStep
    type={state.type === "income" ? "income" : "expense"}
    selectedId={state.categoryId}
    onSelect={(categoryId) => { update({ categoryId }); next(); }}
    onSplitMode={() => {
      setSplitMode(true);
      update({ splits: [{ categoryId: null, amount: "" }, { categoryId: null, amount: "" }] });
    }}
  />
)}

{step === "category" && splitMode && (
  <SplitCategoryStep
    totalAmount={parseFloat(state.amount) || 0}
    currency={state.currency}
    categoryType={state.type === "income" ? "income" : "expense"}
    splits={state.splits}
    onSplitsChange={(splits) => update({ splits })}
    onNext={next}
  />
)}
```

- [ ] **Step 5: Handle split submission in handleSubmit in log-form.tsx**

Replace the single `createTransaction.mutateAsync(...)` call with a split-aware version:

```typescript
if (state.isSplit || splitMode) {
  // Create one transaction per split
  for (const split of state.splits) {
    const splitAmount = parseFloat(split.amount);
    if (isNaN(splitAmount) || splitAmount <= 0) continue;
    const balanceDelta = state.type === "income" ? splitAmount : -splitAmount;
    await createTransaction.mutateAsync({
      account_id: state.accountId!,
      type: state.type,
      amount: splitAmount,
      balance_delta: balanceDelta,
      currency: state.currency,
      category_id: split.categoryId,
      notes: state.notes || null,
      date: state.date,
    });
  }
} else {
  // Single transaction (existing code)
  const balanceDelta = state.type === "income" ? amount : -amount;
  await createTransaction.mutateAsync({
    account_id: state.accountId!,
    type: state.type,
    amount,
    balance_delta: balanceDelta,
    currency: state.currency,
    category_id: state.categoryId,
    notes: state.notes || null,
    date: state.date,
  });
}
```

Also reset `splitMode` in the `reset()` function:
```typescript
function reset() {
  setState(INITIAL_STATE);
  setStep("type");
  setSplitMode(false);
}
```

- [ ] **Step 6: Commit**

```bash
git add components/log/steps/split-category-step.tsx components/log/steps/category-step.tsx components/log/log-form.tsx
git commit -m "feat: add split-across-categories support to log form"
```

---

## Task 16: CSV Export

**Files:**
- Modify: `app/(app)/transactions/page.tsx`
- Modify: `components/transactions/transaction-list.tsx` (expose data for export)

- [ ] **Step 1: Add exportToCsv utility to lib/utils.ts**

```typescript
export function exportToCsv(
  rows: Array<Record<string, string | number | boolean | null>>,
  filename: string
) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Add Export button to transactions/page.tsx**

```tsx
"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { exportToCsv } from "@/lib/utils";
import type { Transaction } from "@/lib/types/database.types";

export default function TransactionsPage() {
  const { data: transactions = [] } = useTransactions();

  function handleExport() {
    const rows = transactions.map((t: Transaction) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      converted_usd: t.converted_amount_usd ?? "",
      category_id: t.category_id ?? "",
      notes: t.notes ?? "",
      account_id: t.account_id,
    }));
    exportToCsv(rows, `moonlit-transactions-${new Date().toISOString().split("T")[0]}.csv`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      <TransactionList showFilters />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/transactions/page.tsx" lib/utils.ts
git commit -m "feat: add CSV export to transactions page"
```

---

## Verification

1. **Accounts list:** Go to `/accounts` → confirm empty state shows → click "Add account" → fill form with initial balance → save → account appears with correct balance
2. **Opening balance transaction:** Go to `/accounts/[id]` → confirm a transaction labelled "Opening balance" appears in history
3. **Log income:** Open `/log` → Income → enter amount → pick category → pick account → save → confirm account balance increases, transaction appears in history
4. **Log expense:** Same as income but balance decreases and amount shows in red
5. **Log transfer:** Log → Transfer → amount → pick source + dest accounts → save → confirm both account balances updated, transfer appears in both histories
6. **Cross-currency transfer:** Pick accounts with different currencies → confirm "amount received" field appears → save → both balances correct
7. **Recurring transaction:** In details step, toggle Repeat → set frequency → save → confirm a row in `recurring_transactions` table in Supabase dashboard
8. **Category inline add:** In category step → click "New" → enter name + color → Add → new category auto-selected and transaction proceeds
9. **Filters:** Go to `/transactions` → filter by type/date/search → confirm list updates
10. **Account edit:** From `/accounts`, click ⋯ → Edit → change name/color → save → card updates
11. **Account archive:** Click ⋯ → Archive → account disappears from list
12. **Exchange rate seed:** In Supabase dashboard, `exchange_rates` table has USD→IDR 16000 row
