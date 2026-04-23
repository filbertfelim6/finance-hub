# Moonlit — Plan 2: Accounts + Transactions + Logger

## Goal

Implement all data-layer and UI for Accounts, Transactions, and the `/log` quick-entry form. After this plan the user can create accounts with opening balances, log income/expense/transfer transactions (including splits and recurring), view account detail pages with filtered history, browse/filter/export the full transaction list, and use the fast mobile Logger from the home-screen icon.

---

## Pre-conditions (Plan 1 complete)

- Auth, app shell, PWA manifest, placeholder routes all in place.
- DB schema (`accounts`, `transactions`, `categories`, `exchange_rates`, `recurring_transactions`) and RLS policies already migrated to Supabase.
- `@tanstack/react-query`, `react-hook-form`, `zod`, `lucide-react`, shadcn/ui components, Supabase browser/server clients all installed.
- `lib/types/database.types.ts` already defines `Account`, `Transaction`, `Category`, `ExchangeRate`, `RecurringTransaction` TypeScript interfaces.

---

## Architecture decisions

| Topic | Decision |
|---|---|
| Data fetching | TanStack Query hooks (`useQuery` / `useMutation`) wrapping thin Supabase query functions in `lib/queries/` |
| Mutation side-effects | `onSuccess` invalidates relevant query keys; balance updates are handled DB-side via Postgres functions called from the insert/update/delete helpers |
| Balance materialization | `accounts.balance` is updated by a Postgres RPC function (`apply_transaction`) called from the create/edit/delete helpers — never patched manually in client code |
| Exchange rate | Read from `exchange_rates` table (seeded by cron, Plan 4). A stub rate (USD 1 = IDR 16 000) is seeded in the migration for offline dev. `formatCurrency` reads the cached rate from TanStack Query |
| Forms | `react-hook-form` + `zod` for all forms; shadcn/ui `<Form>` primitives |
| Log page | Multi-step wizard (Type → Amount → Category → Account → Details → Confirm) managed with local `useState` step index; no routing between steps |
| Split | Up to 5 split lines stored as separate `transactions` rows sharing a `split_group_id` column (added in Task 15 migration) |
| Transfer | Two linked rows sharing `transfer_pair_id`; inserted atomically via RPC |
| CSV export | Client-side: query all matching rows, build CSV string in browser, trigger `<a download>` |

---

## Tasks

### Task 1 — DB Migration: Seed Exchange Rates + RPC Functions

**File:** `supabase/migrations/20260422000001_plan2_rpc.sql`

Add to the DB:

1. **Seed exchange rates** — insert stub USD/IDR rates so dev works without a live cron:
   ```sql
   INSERT INTO exchange_rates (from_currency, to_currency, rate, fetched_at) VALUES
     ('USD', 'IDR', 16000.00, now()),
     ('IDR', 'USD', 0.0000625, now())
   ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = EXCLUDED.rate, fetched_at = now();
   ```

2. **`apply_transaction` RPC** — called after every transaction insert/update/delete to keep `accounts.balance` accurate. Signature:
   ```sql
   create or replace function apply_transaction(
     p_account_id uuid,
     p_type       text,   -- 'income' | 'expense' | 'transfer_in' | 'transfer_out'
     p_amount     numeric,
     p_delta      int     -- +1 for apply, -1 for revert
   ) returns void
   ```
   Logic: `income` / `transfer_in` add `p_amount * p_delta` to balance; `expense` / `transfer_out` subtract. Security: `SECURITY DEFINER` + `SEARCH_PATH = public`.

3. **`insert_transfer` RPC** — atomically inserts both legs of a transfer and calls `apply_transaction` on each:
   ```sql
   create or replace function insert_transfer(
     p_user_id        uuid,
     p_from_account   uuid,
     p_to_account     uuid,
     p_amount         numeric,
     p_currency       text,
     p_converted_usd  numeric,
     p_date           date,
     p_notes          text
   ) returns uuid  -- returns transfer_pair_id
   ```

4. **`delete_transaction` RPC** — reverts balance before deleting; handles transfer pair atomically.

---

### Task 2 — `formatCurrency` Utility

**File:** `lib/format-currency.ts`

```ts
formatCurrency(amount: number, currency: 'USD' | 'IDR', rate?: ExchangeRate | null): string
```

- Uses `Intl.NumberFormat` with correct locale per currency (`en-US` for USD, `id-ID` for IDR).
- When `rate` is provided and the active display currency differs from the transaction currency, appends the converted amount in muted parens.
- Also exports `convertAmount(amount, from, to, rates)` helper.

**Tests:** `__tests__/format-currency.test.ts` — 8 unit tests covering USD format, IDR format, zero, negative, conversion with rate, null rate fallback.

---

### Task 3 — Account Query Functions

**File:** `lib/queries/accounts.ts`

All functions accept a Supabase browser client instance.

| Function | Description |
|---|---|
| `getAccounts(supabase)` | Select all non-archived accounts ordered by `created_at` |
| `getAccount(supabase, id)` | Single account by id |
| `createAccount(supabase, data)` | Insert account + call `apply_transaction` for opening balance if `initialBalance > 0`; also inserts an `is_opening_balance` transaction row |
| `updateAccount(supabase, id, data)` | Patch name/type/color/icon/currency fields only (never touches balance directly) |
| `archiveAccount(supabase, id)` | Set `is_archived = true` |
| `deleteAccount(supabase, id)` | Hard delete (cascades to transactions via FK) |

**Tests:** `__tests__/queries/accounts.test.ts` — mock Supabase client with `vi.fn()`; 6 unit tests (one per function happy path).

---

### Task 4 — Transaction Query Functions

**File:** `lib/queries/transactions.ts`

| Function | Description |
|---|---|
| `getTransactions(supabase, filters)` | Filtered, paginated list. `filters`: `{ accountId?, categoryId?, type?, dateFrom?, dateTo?, search?, page, pageSize }`. Returns `{ data, count }` |
| `getTransaction(supabase, id)` | Single transaction with joined `account` and `category` |
| `createTransaction(supabase, data)` | Insert + call `apply_transaction` RPC. For `transfer` type, delegates to `insert_transfer` RPC |
| `updateTransaction(supabase, id, data)` | Revert old balance, apply new balance via `apply_transaction` |
| `deleteTransaction(supabase, id)` | Call `delete_transaction` RPC (handles balance revert + pair deletion) |
| `getTransactionsForExport(supabase, filters)` | All matching rows (no pagination) with joined account + category names, for CSV |

**Tests:** `__tests__/queries/transactions.test.ts` — 6 unit tests.

---

### Task 5 — Category + Exchange Rate Query Functions

**File:** `lib/queries/categories.ts`

| Function | Description |
|---|---|
| `getCategories(supabase)` | All system + user categories ordered by type then name |
| `createCategory(supabase, data)` | Insert custom category |
| `updateCategory(supabase, id, data)` | Patch name/icon/color |
| `deleteCategory(supabase, id)` | Delete (only if not `is_system`) |

**File:** `lib/queries/exchange-rates.ts`

| Function | Description |
|---|---|
| `getExchangeRates(supabase)` | All rows from `exchange_rates` |
| `getRate(rates, from, to)` | Pure helper — looks up rate from the array |

**Tests:** `__tests__/queries/categories.test.ts` — 4 tests. `__tests__/queries/exchange-rates.test.ts` — 3 tests.

---

### Task 6 — TanStack Query Hooks

**Files:**
- `lib/hooks/use-accounts.ts`
- `lib/hooks/use-transactions.ts`
- `lib/hooks/use-categories.ts`
- `lib/hooks/use-exchange-rates.ts`

Each file exports hooks that wrap the corresponding query functions with `useQuery` / `useMutation` and call `queryClient.invalidateQueries` on mutation success.

Key hooks:
- `useAccounts()` — `queryKey: ['accounts']`
- `useAccount(id)` — `queryKey: ['accounts', id]`
- `useCreateAccount()`, `useUpdateAccount()`, `useArchiveAccount()`, `useDeleteAccount()`
- `useTransactions(filters)` — `queryKey: ['transactions', filters]`
- `useCreateTransaction()`, `useUpdateTransaction()`, `useDeleteTransaction()`
- `useCategories()` — `queryKey: ['categories']`
- `useExchangeRates()` — `queryKey: ['exchange-rates'], staleTime: 5 * 60 * 1000`

All mutation hooks accept `onSuccess` / `onError` callbacks so UI can show toasts.

**Tests:** `__tests__/hooks/use-accounts.test.ts` — 4 tests using `renderHook` from `@testing-library/react` with a mock `QueryClient`.

---

### Task 7 — Account Card + Account Form

**File:** `components/accounts/account-card.tsx`

Displays a single account:
- Colored left border / accent using `account.color`.
- Account name, type badge, balance formatted with `formatCurrency`.
- Archive and delete action buttons in a `DropdownMenu`.
- Clicking the card body navigates to `/accounts/[id]`.

**File:** `components/accounts/account-form.tsx`

`react-hook-form` + `zod` form for create/edit.

Fields:
- `name` — text input, required, max 50
- `type` — select: checking / savings / cash / ewallet
- `currency` — select: USD / IDR
- `color` — color picker (6 preset swatches + custom hex input)
- `icon` — icon picker (grid of 12 lucide icons: `wallet`, `credit-card`, `piggy-bank`, `landmark`, `banknote`, `coins`, `briefcase`, `shopping-bag`, `smartphone`, `globe`, `building`, `star`)
- `initialBalance` — number input, only shown when `mode === 'create'`

Zod schema enforces required fields and `initialBalance >= 0`.

**Tests:** `__tests__/components/account-form.test.tsx` — 4 tests: renders all fields, submit disabled when invalid, submit fires with correct data, edit mode hides initialBalance.

---

### Task 8 — Accounts Page

**File:** `app/(app)/accounts/page.tsx`

Client component (uses `useAccounts` hook):
- Page header: "Accounts" title + "Add account" button that opens `<AccountForm>` in a shadcn `<Sheet>` (slide-over).
- Renders `<AccountCard>` for each account.
- Empty state: illustration + "No accounts yet. Add your first one."
- Loading state: 3 skeleton cards.
- Shows total net worth across all accounts in the page header (converted to display currency).

`<AccountForm>` is wired to `useCreateAccount` / `useUpdateAccount`. On success, shows a toast and closes the sheet.

**Tests:** `__tests__/pages/accounts.test.tsx` — 3 tests: loading skeleton, empty state, renders account cards.

---

### Task 9 — Transaction Item + List + Filters

**File:** `components/transactions/transaction-item.tsx`

Single transaction row:
- Date, category icon + name, account name, notes truncated.
- Amount colored green (income) / red (expense) / gray (transfer).
- Swipe-to-delete on mobile (CSS-only, translate on `touchstart`/`touchend`).
- Click to open edit sheet.

**File:** `components/transactions/transaction-filters.tsx`

Filter bar (collapsible on mobile):
- Date range picker (start/end date inputs).
- Account multi-select.
- Category multi-select.
- Type toggle (income / expense / transfer / all).
- Amount range (min/max number inputs).
- Search input (debounced 300 ms).
- "Clear filters" button.

All filter state managed via URL search params (`useSearchParams` + `useRouter`).

**File:** `components/transactions/transaction-list.tsx`

Groups `<TransactionItem>` rows by date with sticky date headers. Infinite scroll via `useIntersectionObserver` + `fetchNextPage` from `useInfiniteQuery`.

---

### Task 10 — Transactions Page + Account Detail Page

**File:** `app/(app)/transactions/page.tsx`

- `<TransactionFilters>` + `<TransactionList>` composition.
- "Export CSV" button (calls `getTransactionsForExport`, triggers download).
- Page header shows total filtered income, total filtered expense, net.

**File:** `app/(app)/accounts/[id]/page.tsx`

- Account name, type, balance hero area.
- Edit and archive actions in header.
- `<TransactionFilters>` pre-filtered to this account (account filter locked/hidden).
- `<TransactionList>` for account transactions.
- "Back to Accounts" breadcrumb link.

---

### Task 11 — Log Form Shell + Type Step + Amount Step

**File:** `components/log/log-form.tsx`

Multi-step wizard shell. State: `step` (0–4), `formData` (accumulated across steps). Navigation: back/next buttons; keyboard `Enter` advances.

Step 0 — **Type**
- Three large tap-target buttons: Income / Expense / Transfer.
- Keyboard: `1`/`2`/`3` shortcuts.
- Transfer type shows a note: "Two accounts will be linked."

Step 1 — **Amount**
- Large numeric input with currency selector (USD / IDR).
- Display: formatted number updates live as user types.
- "Split" button appears for income/expense (disabled for transfer). Opens split UI (Task 15).
- `Repeat` toggle expands frequency selector: Daily / Weekly / Monthly / Yearly.

---

### Task 12 — Category Step + Account Step

Step 2 — **Category** (income/expense only; skipped for transfer)
- Grid of category icon buttons, grouped income then expense.
- Highlighted when selected.
- "+ New category" inline form at the bottom: name, type, color swatch, icon picker. Saves via `useCreateCategory` and auto-selects the new category.

Step 3 — **Account**
- For income/expense: single account selector (compact `<AccountCard>` list).
- For transfer: "From" account then "To" account — two separate pickers rendered sequentially.

---

### Task 13 — Details Step + Full Log Form Wiring

Step 4 — **Details**
- Date picker (defaults to today; calendar popover using a shadcn `<Popover>` wrapping `<input type="date">`).
- Notes text area (optional, max 200 chars).
- Summary card: type badge, amount, category, account(s), date.

**Wiring**
- "Save" button triggers `useCreateTransaction` with the full accumulated `formData`.
- For recurring: also inserts a `recurring_transactions` row with the transaction template + frequency + `next_due_date = date + 1 interval`.
- On success: toast "Transaction saved", reset form to step 0.
- On error: inline error message on the Summary card.

---

### Task 14 — Log Page

**File:** `app/log/page.tsx`

Renders `<LogForm>` centered on the screen with a minimal header ("Log Transaction" + close `X` that goes back).

On mobile (PWA start_url): full-screen, no sidebar/bottom-nav chrome (the `/log` route is outside the `(app)` layout — already the case from Plan 1).

Keyboard shortcut: `Escape` navigates back to `/`.

---

### Task 15 — Split Transactions

**Feature extension of Task 11 (Amount step)**

When "Split" is tapped:
- Amount step transforms into a split editor.
- Up to 5 rows, each with: category selector + amount input.
- Running total shown; "Remaining" counter goes to zero when all amounts sum correctly.
- Validation: sum of split amounts must equal the top-level amount.

On save: each split line creates a separate `transactions` row. A shared UUID is written into a new `split_group_id` column.

**New migration:** `supabase/migrations/20260422000002_split_group.sql`
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS split_group_id UUID;
```

**Tests:** `__tests__/components/split-editor.test.tsx` — 4 tests.

---

### Task 16 — CSV Export

**File:** `lib/export-csv.ts`

```ts
exportTransactionsCSV(transactions: TransactionWithJoins[]): void
```

Columns: Date, Type, Account, Category, Amount, Currency, Notes.

Uses `Blob` + `URL.createObjectURL` + programmatic `<a>` click — no server round-trip.

**Tests:** `__tests__/export-csv.test.ts` — 3 tests: correct headers, IDR formatting, empty array produces header-only file.

---

## File tree produced by Plan 2

```
supabase/migrations/
  20260422000001_plan2_rpc.sql         (Task 1)
  20260422000002_split_group.sql       (Task 15)

lib/
  format-currency.ts                   (Task 2)
  queries/
    accounts.ts                        (Task 3)
    transactions.ts                    (Task 4)
    categories.ts                      (Task 5)
    exchange-rates.ts                  (Task 5)
  hooks/
    use-accounts.ts                    (Task 6)
    use-transactions.ts                (Task 6)
    use-categories.ts                  (Task 6)
    use-exchange-rates.ts              (Task 6)
  export-csv.ts                        (Task 16)

components/
  accounts/
    account-card.tsx                   (Task 7)
    account-form.tsx                   (Task 7)
  transactions/
    transaction-item.tsx               (Task 9)
    transaction-filters.tsx            (Task 9)
    transaction-list.tsx               (Task 9)
  log/
    log-form.tsx                       (Tasks 11-13)
    split-editor.tsx                   (Task 15)

app/
  (app)/
    accounts/
      page.tsx                         (Task 8)
      [id]/
        page.tsx                       (Task 10)
    transactions/
      page.tsx                         (Task 10)
  log/
    page.tsx                           (Task 14)

__tests__/
  format-currency.test.ts              (Task 2)
  export-csv.test.ts                   (Task 16)
  queries/
    accounts.test.ts                   (Task 3)
    transactions.test.ts               (Task 4)
    categories.test.ts                 (Task 5)
    exchange-rates.test.ts             (Task 5)
  hooks/
    use-accounts.test.ts               (Task 6)
  components/
    account-form.test.tsx              (Task 7)
    accounts.test.tsx                  (Task 8)
    split-editor.test.tsx              (Task 15)
```

---

## Test targets

| Suite | Min tests | Notes |
|---|---|---|
| `format-currency.test.ts` | 8 | Unit |
| `export-csv.test.ts` | 3 | Unit |
| `queries/accounts.test.ts` | 6 | Unit (mocked Supabase) |
| `queries/transactions.test.ts` | 6 | Unit |
| `queries/categories.test.ts` | 4 | Unit |
| `queries/exchange-rates.test.ts` | 3 | Unit |
| `hooks/use-accounts.test.ts` | 4 | `renderHook` |
| `components/account-form.test.tsx` | 4 | `@testing-library/react` |
| `components/accounts.test.tsx` | 3 | `@testing-library/react` |
| `components/split-editor.test.tsx` | 4 | `@testing-library/react` |
| **Total** | **45** | |

All existing 20 unit tests and 5 E2E tests must continue to pass.

---

## Execution order

Tasks are grouped into three sequential waves. Within each wave, tasks are independent and can be run in parallel.

**Wave 1 — Foundation (parallel)**
- Task 1: DB Migration
- Task 2: formatCurrency Utility
- Task 3: Account Query Functions
- Task 4: Transaction Query Functions
- Task 5: Category + Exchange Rate Query Functions

**Wave 2 — Hooks + Components (parallel, depends on Wave 1)**
- Task 6: TanStack Query Hooks
- Task 7: Account Card + Account Form
- Task 9: Transaction Item + List + Filters
- Task 16: CSV Export

**Wave 3 — Pages + Log (parallel, depends on Wave 2)**
- Task 8: Accounts Page
- Task 10: Transactions Page + Account Detail
- Task 11: Log Form Shell + Type Step + Amount Step
- Task 12: Category Step + Account Step
- Task 13: Details Step + Full Log Form Wiring
- Task 14: Log Page
- Task 15: Split Transactions (depends on Task 11)

---

## Verification checklist

After all tasks complete, manually verify:

- [ ] Create an account (IDR, checking) with opening balance 500 000 — balance shows correctly, opening balance transaction appears in account detail.
- [ ] Create a second account (USD, savings) with $0 opening balance.
- [ ] Log an expense (IDR, Food & Drink, 50 000) — IDR account balance decreases by 50 000.
- [ ] Log income (USD, Salary, $2 000) — USD account balance increases by $2 000.
- [ ] Log a transfer of 100 000 IDR between two IDR accounts — both balances update correctly.
- [ ] Log a split expense: 80 000 Food + 20 000 Transport = 100 000 total.
- [ ] Log a recurring monthly expense — verify a `recurring_transactions` row was created with correct `next_due_date`.
- [ ] Navigate to `/accounts` — all accounts listed with correct balances.
- [ ] Navigate to `/accounts/[id]` — transactions filtered to that account, balance shown in hero.
- [ ] Navigate to `/transactions` — all transactions visible; filter by type "expense"; clear filters.
- [ ] Export CSV — file downloads with correct headers and data.
- [ ] Open `/log` on mobile (or narrow viewport) — no sidebar/bottom-nav, full-screen form.
- [ ] All 45+ unit tests pass (`npm test`).
- [ ] All 5 E2E tests still pass (`npm run test:e2e`).
