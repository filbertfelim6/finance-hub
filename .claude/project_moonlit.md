---
name: Moonlit Finance App
description: Personal finance PWA project — full history, current status, what's done and what's next
type: project
originSessionId: 386bdb9c-3068-42f3-8bd2-595ffc3ea90d
---

Building **Moonlit**, a personal finance PWA for Felim (employee in BSD, 3 bank accounts, tracks IDR + USD).

**Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS v4 + shadcn/ui (base-nova, `@base-ui/react`), Supabase (Postgres + Auth + RLS), TanStack Query v5, Recharts, `@ducanh2912/next-pwa`, Vercel deployment. Fonts: `geist` npm package (local, not Google Fonts), `transpilePackages: ["geist"]` in next.config.ts.

**Plans location:** `/Users/filbertfelim/Filbert Felim/Claude/.claude/plans/`
- `i-want-to-build-moonlit-moler.md` — full design spec (approved)
- `2026-04-23-moonlit-plan-2-accounts-transactions.md` — Plan 2 implementation plan

---

## Plan 1: Foundation — COMPLETE (as of 2026-04-22)

**What was built:**
- Auth: register, login (email/password + Google OAuth), forgot password, reset password
- App shell: collapsible sidebar (desktop), bottom nav + FAB (mobile), dark/light mode
- PWA manifest, `/log` as start_url (placeholder)
- Dashboard, Accounts, Transactions, Budgets, Settings, Log routes (placeholders)
- 20 unit tests (Vitest), 5 E2E auth tests (Playwright)

**Post-Plan-1 fixes applied:**
- Password reset redirect: `redirectTo` now points to `?next=/auth/reset-password` (was `/settings`)
- Reset password page: `app/auth/reset-password/page.tsx` — server component reads `pw_reset_pending` cookie; shows form if valid, else "Link expired"
- Reset password form: `components/auth/reset-password-form.tsx` — calls `supabase.auth.updateUser({ password })`, clears cookie via server action, redirects to `/`
- Reset cookie server action: `components/auth/reset-password-actions.ts`
- Auth callback route (`app/auth/callback/route.ts`): handles BOTH `code` (PKCE/OAuth via `exchangeCodeForSession`) AND `token_hash`+`type` (email OTP via `verifyOtp`). Sets `pw_reset_pending` cookie when `next=/auth/reset-password`
- Google OAuth "Something went wrong" on forgot password: added `"recovery email"` to OAuth detection keywords in forgot-password-form
- Resend cooldown: 60s localStorage-persisted cooldown on forgot-password form
- CheckCircle icons on email-sent success states (forgot-password + register forms)
- "Error sending confirmation email" on register: shows "Account created but email failed" message
- Zod v4 fix: `z.email({ error: "..." })` replaces deprecated `z.string().email("...")`
- Geist font: switched from `next/font/google` to `geist` npm package in `app/layout.tsx`; fixed CSS variable self-reference bug `--font-sans: var(--font-geist-sans)` in `globals.css`; added `transpilePackages: ["geist"]` in `next.config.ts`
- Settings placeholder page: `app/(app)/settings/page.tsx`

---

## Plan 2: Accounts + Transactions — COMPLETE (as of 2026-04-25)

All 16 tasks done. 41 tests pass, TypeScript clean.

**What was built:**
- DB: `supabase/migrations/20260423000001_seed_and_functions.sql` — exchange rate seed + `create_transaction_with_balance` RPC (run manually in Supabase SQL editor)
- Queries: `lib/queries/accounts.ts`, `transactions.ts`, `categories.ts`, `exchange-rates.ts`
- Hooks: `lib/hooks/use-accounts.ts`, `use-transactions.ts`, `use-categories.ts`, `use-exchange-rate.ts` (includes `useUsdToIdr()`)
- Accounts UI: `components/accounts/account-card.tsx`, `account-form.tsx`, `app/(app)/accounts/page.tsx`, `app/(app)/accounts/[id]/page.tsx`
- Transactions UI: `components/transactions/transaction-item.tsx`, `transaction-filters.tsx`, `transaction-list.tsx`, `app/(app)/transactions/page.tsx` (with Export CSV button)
- Log form: `components/log/log-form.tsx` (multi-step), steps: `type-step.tsx`, `amount-step.tsx`, `category-step.tsx`, `account-step.tsx`, `details-step.tsx`, `split-category-step.tsx`
- Log page: `app/(app)/log/page.tsx` (old `app/log/page.tsx` deleted)
- Utils: `formatCurrency(amount, currency)`, `exportToCsv(rows, filename)` in `lib/utils.ts`

**Key implementation notes:**
- Split transactions: `splitMode` local state + `state.isSplit` kept in sync; each split has `id: crypto.randomUUID()` for stable React keys
- Transfer: two linked rows via `transfer_pair_id = crypto.randomUUID()`; cross-currency shows "Amount received" field
- `<Toaster />` added to `app/(app)/layout.tsx`
- Test count: 41 unit tests (Vitest)

---

## Key codebase patterns

- `@base-ui/react` (NOT Radix UI): use `render` prop, NOT `asChild` on triggers
- `DropdownMenuTrigger`: use `render={<Button aria-label="more">...}` pattern
- shadcn add: `npx shadcn@latest add <component> --yes`
- AGENTS.md says: read `node_modules/next/dist/docs/` before writing Next.js code
- `app/(app)/` route group: inherits QueryClientProvider, sidebar, bottom nav; URL transparent
- Next.js 15 dynamic params: `params: Promise<{ id: string }>` + `const { id } = use(params)`
- Supabase patterns: `if (error) throw error` — never `if (error) return null`
- TanStack Query v5: `invalidateQueries({ queryKey: [...] })` object form (not v4 shorthand)
- Test mocking: Supabase client mocked via `vi.mock("@/lib/supabase/client", ...)` with chainable mock functions; DropdownMenu mocked in component tests (Portal-based content doesn't render in JSDOM)
- sonner toast: import from `"sonner"`, add `<Toaster />` to `app/(app)/layout.tsx` or `app/layout.tsx`

---

## Session 2026-04-28: Dashboard charts + Terra theme

### Y-axis compact formatting (all 4 chart components)
Added `formatCurrencyCompact` to `lib/utils.ts` — formats large numbers to short notation (e.g. "Rp1.5B", "$1.2M") to fit within the 70px YAxis width. Applied to:
- `components/dashboard/net-worth-chart.tsx`
- `components/dashboard/income-expense-chart.tsx`
- `components/dashboard/cashflow-waterfall-chart.tsx`
- `components/dashboard/category-trend-chart.tsx`

All four now use `tickFormatter={(v) => isPrivate ? "••••" : formatCurrencyCompact(v, displayCurrency)}` on their `<YAxis>`.

```typescript
// lib/utils.ts — formatCurrencyCompact
export function formatCurrencyCompact(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `${sign}${sym}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `${sign}${sym}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3)  return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
  return formatCurrency(amount, currency);
}
```

### Terra earth tone theme — applied to `app/globals.css`
Replaced achromatic (chroma=0) theme with warm earth tones:
- **Light:** warm cream background `oklch(0.98 0.012 75)`, terracotta primary `oklch(0.54 0.14 42)`, deeper tan sidebar `oklch(0.94 0.018 70)`
- **Dark:** deep espresso background `oklch(0.16 0.025 45)`, warm ochre primary `oklch(0.76 0.09 65)`, deeper espresso sidebar `oklch(0.13 0.025 45)`

### Dashboard chart accent colors updated
- `income-expense-chart.tsx`: expenses bar `fill="#b5603b"` (was `#ef4444` red)
- `savings-rate-chart.tsx`: line `stroke="#a07850"` (was `#6366f1` indigo)
- `net-worth-chart.tsx`: `CHART_COLORS` replaced with earth tone palette

### Critical fix: Tailwind v4 theme changes require `.next` cache clear
**Symptom:** Theme changes in `globals.css` not showing in browser despite correct CSS.
**Root cause:** Tailwind v4 with `@theme inline` compiles CSS variable values to **static output at build time** (e.g. `--background:#fff`). The `.next` cache holds stale compiled CSS. HMR doesn't always recompile theme tokens.
**Fix:** `rm -rf .next` then `npm run dev` to force a full rebuild.
**When to apply:** Any time OKLch values in `:root` or `.dark` blocks in `globals.css` are changed.

---

## Plans 3 and 4 (not yet written)
- Plan 3: Dashboard + Visualizations
- Plan 4: Budgets + Goals + Settings + Currency Cron
