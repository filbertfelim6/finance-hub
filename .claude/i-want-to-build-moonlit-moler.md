# Moonlit — Personal Finance App: Design Spec

## Context

Felim is an employee in BSD with 3 bank accounts who wants to start tracking spending, budgeting, investing, and setting financial goals. He tracks in both IDR and USD. The app needs to be usable across desktop, tablet, and mobile — with a minimal, clean aesthetic (Linear/Mercury-style). Mobile usage is primarily quick transaction logging; desktop is analysis and review.

---

## Architecture

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Supabase (Postgres + Auth + Row Level Security) |
| Deployment | Vercel |
| PWA | `@ducanh2912/next-pwa` |
| Currency rates | ExchangeRate-API + Vercel Cron (hourly refresh) |
| Server state | TanStack Query |

**Currency rate strategy:** A Vercel Cron job fetches USD↔IDR rates from ExchangeRate-API hourly and upserts into a `exchange_rates` table in Supabase. All clients read from the DB — never directly from the API. Free tier allows 1,500 req/month; hourly = 720/month.

**Auth:** Supabase Auth — email/password + Google OAuth. All routes except `/auth/*` are protected. All DB tables are scoped to `user_id` with Row Level Security.

---

## Data Model

All tables include `user_id` (FK → auth.users) with RLS policies enforcing per-user isolation.

### accounts
```
id, user_id, name, type (checking | savings | cash | ewallet),
currency, balance, color, icon, is_archived, created_at
```
- `balance` is a materialized field, updated on every transaction write.

### transactions
```
id, user_id, account_id, type (income | expense | transfer),
amount, currency, converted_amount_usd (always stored in USD for consistent cross-currency aggregation), category_id,
notes, date, recurring_id, transfer_pair_id,
is_opening_balance, created_at
```
- Transfers are stored as two linked rows connected by `transfer_pair_id` (debit on source, credit on destination).
- `is_opening_balance` flags the auto-created transaction when an account is first created with an initial balance.
- Each transaction stores its own `currency` and `amount`; display conversion uses the cached rate.

### categories
```
id, user_id, name, type (income | expense), icon, color,
parent_id (for subcategories), is_system, created_at
```
- Ships with sensible defaults (Food, Transport, Salary, etc.) marked `is_system = true`.
- Users can add, rename, recolor, or delete custom categories.
- New categories can be created inline during transaction entry.

### budgets
```
id, user_id, category_id, amount, currency,
period (monthly | weekly), created_at
```

### savings_goals
```
id, user_id, name, target_amount, current_amount, currency,
deadline, color, icon, linked_account_id, created_at
```

### recurring_transactions
```
id, user_id, transaction_template (jsonb), frequency
(daily | weekly | monthly | yearly), next_due_date, created_at
```

### exchange_rates
```
id, from_currency, to_currency, rate, fetched_at
```

---

## Routes

| Route | Purpose |
|---|---|
| `/auth/login` | Email/password sign-in + Google OAuth |
| `/auth/register` | New account creation |
| `/auth/forgot-password` | Password reset via email |
| `/` | Dashboard |
| `/accounts` | Account list |
| `/accounts/[id]` | Account detail + filtered transaction history |
| `/transactions` | Full transaction history with filters |
| `/budgets` | Budget management |
| `/goals` | Savings goals |
| `/settings` | App settings |
| `/log` | Quick transaction logger (PWA start_url) |

---

## Navigation

- **Desktop (≥1024px):** Collapsible sidebar. Full labels or icon-only. Items: Dashboard, Accounts, Transactions, Budgets, Settings. Light/dark toggle pinned at the bottom of the sidebar.
- **Tablet (768–1023px):** Sidebar collapses to icon-only by default.
- **Mobile (<768px):** Bottom tab bar (Dashboard, Accounts, Transactions, Budgets, Settings) + FAB `+` that opens `/log`. Light/dark toggle in Settings page header.

---

## Dashboard Layout Variations

Three variants — user selects in Settings, can switch anytime:

- **A — Grid:** Metric cards in a responsive grid, charts stacked below.
- **B — Hero:** Net worth in large type at top, KPIs below, charts in a scrollable row.
- **C — Column:** Left column = balances + savings rate + goals; right = charts. Best on wide screens.

---

## Dashboard Visualizations

Each chart card has its own independent range selector with presets:
**1d · 7d · 15d · 30d · 60d · 90d · 180d · 1Y · Custom**

Data granularity auto-adapts:

| Range | Granularity |
|---|---|
| 1d | Per-transaction |
| 7d – 15d | Daily |
| 30d – 60d | Daily or weekly |
| 90d – 180d | Weekly |
| 1Y | Monthly |

### Charts

1. **Net worth trend line** — stacked by account. Full free range + granularity.
2. **Income vs. expenses bar chart** — bar label adapts ("Daily / Weekly / Monthly") to granularity.
3. **Category donut/sunburst** — current period expenses, drillable into subcategories.
4. **Savings rate gauge/ring** — `(income - expenses) / income` for selected period.
5. **Budget-vs-actual horizontal bars** — range selector acts as a period picker (e.g. "April 2026"). Color codes green → yellow → red.
6. **Forecast line** — projected balance at 30/60/90 days from today using recurring transactions + average spend. No range selector (always forward-looking).

Top of dashboard: account balance cards with USD ↔ IDR toggle. Privacy mode replaces all figures with `••••`.

**Financial Health Score** — 0–100 ring. Composed of: savings rate, budget adherence, goal progress, expense consistency. Short plain-English summary below (e.g. "You're saving well but over budget on Food").

---

## Transaction Logger (`/log`)

Designed for speed — 2-tap entry from home screen (PWA `start_url`):

**Flow:** Type (income / expense / transfer) → Amount + Currency → Category (+ inline add new) → Account → Date (defaults today) → Notes (optional) → Save

- **Split:** From amount screen, tap "Split" to divide across multiple categories.
- **Recurring:** Toggle "Repeat" → frequency (daily / weekly / monthly / yearly).
- **Transfer:** Selects source account and destination account; creates two linked transactions.

---

## Accounts

- List view with balance per account, converted to display currency.
- Tap to open account detail with filtered transaction history.
- Initial balance: entered at account creation, auto-creates an `is_opening_balance` transaction.
- Archive: hides from dashboard and account list but preserves full history.

---

## Transactions

- Full list with filters: date range, account, category, type, amount range.
- Search by notes.
- Export to CSV.

---

## Budgets

- Set monthly or weekly spending limits per category.
- Progress bars with green → yellow → red color coding as spend approaches limit.
- Optional over-budget browser push notification (via Supabase + Web Push).

---

## Savings Goals

- Fields: name, target amount, currency, optional deadline, color, icon, linked account (optional).
- Progress ring on `/goals` page and as a dashboard widget.
- Contributions tracked manually (user logs a contribution) or auto-tracked: any income transaction posted to the linked savings account is automatically counted as a goal contribution.

---

## Settings

### Display
- Default display currency (USD / IDR)
- Dashboard layout variant (A / B / C)
- Sidebar default (expanded / collapsed)
- Compact mode (reduces table row height and spacing on desktop; affects Transactions and Accounts list views)

### Privacy & Security
- Privacy mode (manually hide all balances)
- Auto-hide on app blur (tab switch / window minimize)
- Inactivity timer: Never · 1 min · 5 min · 15 min

### Appearance
- Light / dark mode (also accessible from sidebar bottom)

### Data
- Manage categories (add, rename, recolor, delete)
- Manage recurring transactions

---

## Currency Handling

- Supported currencies: **USD, IDR**.
- Each transaction stores its native `currency` and `amount`.
- At display time, all amounts convert to the active display currency using the cached rate.
- Display currency toggled globally via a dropdown in the dashboard header.
- Per-transaction currency can be set independently in the logger.

---

## Authentication Flows

| Flow | Detail |
|---|---|
| Register | Email + password. Email verification via Supabase. |
| Login | Email/password + "Continue with Google" (Google OAuth via Supabase). |
| Forgot password | Email link → reset password page. |
| Session | Supabase JWT, auto-refreshed. Unauthenticated → redirect to `/auth/login`. |

---

## UI & Aesthetic

- Clean & minimal, Linear/Mercury-style: lots of whitespace, muted palette.
- Light and dark mode via Tailwind `dark:` classes + shadcn/ui theming.
- Typography-led design: net worth and key figures displayed in large, confident type.
- Muted grays for secondary data; accent color for CTAs and active states.

---

## Verification

1. **Auth:** Register a new user, verify email, log in, confirm Google OAuth flow works.
2. **Accounts:** Create account with initial balance → confirm opening balance transaction created → balance displayed correctly.
3. **Transactions:** Log income, expense, transfer across two accounts → confirm both account balances update correctly → confirm transfer appears in both account histories.
4. **Currency conversion:** Add a USD transaction to an IDR account → switch display currency → confirm converted amount is correct using cached rate.
5. **Dashboard:** Confirm all 6 charts render, range selectors filter data correctly, granularity adapts per range.
6. **Budgets:** Set a budget, add expense in that category, confirm progress bar updates and over-budget alert triggers.
7. **Goals:** Create a savings goal, log a contribution, confirm progress ring updates.
8. **PWA:** Install on mobile, open from home screen, confirm `/log` is the landing page, confirm offline-safe behavior.
9. **Privacy mode:** Toggle on → confirm all balances hidden → auto-hide on blur → confirm inactivity timer works.
10. **Responsive:** Verify sidebar → icon-only on tablet, bottom nav on mobile, FAB visible.
