# Moonlit — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Moonlit personal finance app — Next.js 15 project with Supabase schema, email/password + Google OAuth, app shell navigation (sidebar + bottom nav + FAB), dark/light mode, and PWA manifest. Result: a user can register, verify email, log in with email or Google, and see the empty app shell.

**Architecture:** Next.js 15 App Router with two route groups — `(auth)` for public auth pages and `(app)` for protected app pages. Supabase SSR (`@supabase/ssr`) handles session management via cookies with a Next.js middleware refreshing sessions on every request. Navigation is sidebar on desktop/tablet, bottom tab bar on mobile, with a FAB for quick transaction logging.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v3, shadcn/ui, Supabase (Postgres + Auth + RLS), `@supabase/ssr`, `next-themes`, `@ducanh2912/next-pwa`, Vitest + React Testing Library, Playwright

> **Note:** This is Plan 1 of 4. Plans 2–4 cover Accounts/Transactions, Dashboard/Charts, and Budgets/Goals/Settings respectively.

---

## File Map

```
moonlit/                                      ← project root (created in Task 1)
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                    ← Login page
│   │   ├── register/page.tsx                 ← Register page
│   │   └── forgot-password/page.tsx          ← Forgot password page
│   ├── (app)/
│   │   ├── layout.tsx                        ← Protected shell: sidebar + bottom nav
│   │   └── page.tsx                          ← Dashboard placeholder
│   ├── auth/callback/route.ts                ← Supabase OAuth callback
│   ├── layout.tsx                            ← Root layout: fonts, ThemeProvider
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── login-form.tsx                    ← Email/password + Google sign-in form
│   │   ├── register-form.tsx                 ← New user registration form
│   │   └── forgot-password-form.tsx          ← Password reset request form
│   └── layout/
│       ├── sidebar.tsx                       ← Desktop collapsible sidebar
│       ├── sidebar-nav-item.tsx              ← Single nav item (icon + label)
│       ├── bottom-nav.tsx                    ← Mobile bottom tab bar
│       └── fab.tsx                           ← Floating action button (+)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         ← Browser Supabase client (singleton)
│   │   └── server.ts                         ← Server Supabase client (RSC/actions)
│   └── types/
│       └── database.types.ts                 ← TypeScript entity types
├── middleware.ts                             ← Session refresh + auth redirect
├── supabase/
│   └── migrations/
│       ├── 20260419000001_schema.sql         ← All CREATE TABLE statements
│       └── 20260419000002_rls.sql            ← All RLS policies
├── public/
│   ├── manifest.json                         ← PWA manifest
│   └── icons/
│       ├── icon-192.png                      ← PWA icon (provide your own)
│       └── icon-512.png
├── __tests__/
│   ├── components/auth/
│   │   ├── login-form.test.tsx
│   │   └── register-form.test.tsx
│   └── components/layout/
│       ├── sidebar.test.tsx
│       └── bottom-nav.test.tsx
├── e2e/
│   ├── auth.spec.ts                          ← Register, login, logout E2E
│   └── navigation.spec.ts                   ← App shell navigation E2E
├── vitest.config.ts
├── vitest.setup.ts
├── playwright.config.ts
├── next.config.ts
└── vercel.json
```

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `moonlit/` (entire project)
- Create: `moonlit/next.config.ts`
- Create: `moonlit/vercel.json`

- [ ] **Step 1: Create the Next.js app**

Run from `/Users/filbertfelim/Filbert\ Felim/Claude`:
```bash
npx create-next-app@latest moonlit \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-eslint
```
When prompted: select **no** for Turbopack (use default webpack for `next-pwa` compatibility).

- [ ] **Step 2: Install all dependencies**

```bash
cd moonlit

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI
npm install next-themes lucide-react class-variance-authority clsx tailwind-merge

# Forms + validation
npm install react-hook-form @hookform/resolvers zod

# State / data fetching
npm install @tanstack/react-query

# PWA
npm install @ducanh2912/next-pwa

# shadcn/ui CLI (dev)
npm install -D @shadcn/ui

# Test
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D playwright @playwright/test
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

Then add the components used in this plan:
```bash
npx shadcn@latest add button input label form card separator toast avatar dropdown-menu sheet tooltip
```

- [ ] **Step 4: Write `next.config.ts`**

```typescript
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWAConfig(nextConfig);
```

- [ ] **Step 5: Write `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/exchange-rates",
      "schedule": "0 * * * *"
    }
  ]
}
```

- [ ] **Step 6: Add `.env.local` template**

Create `moonlit/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXCHANGE_RATE_API_KEY=your-exchangerate-api-key
CRON_SECRET=your-random-secret-string
```

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 15 project with deps"
```
Expected: commit succeeds, no errors.

---

## Task 2: Configure Vitest + React Testing Library

**Files:**
- Create: `moonlit/vitest.config.ts`
- Create: `moonlit/vitest.setup.ts`
- Modify: `moonlit/package.json` (add test scripts)

- [ ] **Step 1: Write `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 2: Write `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Add scripts to `package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 4: Write smoke test to verify setup**

Create `__tests__/smoke.test.ts`:
```typescript
describe("test setup", () => {
  it("works", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 5: Run smoke test**

```bash
npm test
```
Expected output:
```
✓ __tests__/smoke.test.ts > test setup > works
Test Files  1 passed (1)
```

- [ ] **Step 6: Configure Playwright**

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 7: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium webkit
```
Expected: downloads chromium and webkit.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: configure Vitest and Playwright"
```

---

## Task 3: Database Schema Migration

**Files:**
- Create: `supabase/migrations/20260419000001_schema.sql`

- [ ] **Step 1: Install Supabase CLI and initialize**

```bash
npm install -D supabase
npx supabase init
npx supabase start
```
Expected: local Supabase running at `http://localhost:54321`. Note the output — it prints the local `anon key` and `service_role key`. Update `.env.local` with these values for local dev.

- [ ] **Step 2: Write schema migration**

Create `supabase/migrations/20260419000001_schema.sql`:
```sql
-- accounts
CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'cash', 'ewallet')),
  currency    TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  balance     NUMERIC(20, 2) NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  icon        TEXT NOT NULL DEFAULT 'wallet',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  type      TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon      TEXT NOT NULL DEFAULT 'tag',
  color     TEXT NOT NULL DEFAULT '#6366f1',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- transactions
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount                NUMERIC(20, 2) NOT NULL,
  currency              TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  converted_amount_usd  NUMERIC(20, 2),
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes                 TEXT,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring_id          UUID,
  transfer_pair_id      UUID,
  is_opening_balance    BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- budgets
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(20, 2) NOT NULL,
  currency    TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  period      TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- savings_goals
CREATE TABLE savings_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_amount     NUMERIC(20, 2) NOT NULL,
  current_amount    NUMERIC(20, 2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL CHECK (currency IN ('USD', 'IDR')),
  deadline          DATE,
  color             TEXT NOT NULL DEFAULT '#6366f1',
  icon              TEXT NOT NULL DEFAULT 'piggy-bank',
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- recurring_transactions
CREATE TABLE recurring_transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_template JSONB NOT NULL,
  frequency            TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date        DATE NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exchange_rates
CREATE TABLE exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency   TEXT NOT NULL,
  rate          NUMERIC(20, 8) NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);

-- Seed system categories (no user_id = available to all users)
INSERT INTO categories (id, user_id, name, type, icon, color, is_system) VALUES
  (gen_random_uuid(), NULL, 'Salary',         'income',  'briefcase',   '#22c55e', true),
  (gen_random_uuid(), NULL, 'Freelance',       'income',  'laptop',      '#22c55e', true),
  (gen_random_uuid(), NULL, 'Investment',      'income',  'trending-up', '#22c55e', true),
  (gen_random_uuid(), NULL, 'Other Income',    'income',  'plus-circle', '#22c55e', true),
  (gen_random_uuid(), NULL, 'Food & Drink',    'expense', 'utensils',    '#ef4444', true),
  (gen_random_uuid(), NULL, 'Transport',       'expense', 'car',         '#f97316', true),
  (gen_random_uuid(), NULL, 'Shopping',        'expense', 'shopping-bag','#a855f7', true),
  (gen_random_uuid(), NULL, 'Health',          'expense', 'heart',       '#ec4899', true),
  (gen_random_uuid(), NULL, 'Bills & Utilities','expense','zap',         '#eab308', true),
  (gen_random_uuid(), NULL, 'Entertainment',   'expense', 'tv',          '#3b82f6', true),
  (gen_random_uuid(), NULL, 'Education',       'expense', 'book',        '#06b6d4', true),
  (gen_random_uuid(), NULL, 'Travel',          'expense', 'plane',       '#8b5cf6', true),
  (gen_random_uuid(), NULL, 'Housing',         'expense', 'home',        '#64748b', true),
  (gen_random_uuid(), NULL, 'Other Expense',   'expense', 'more-horizontal','#94a3b8', true);
```

- [ ] **Step 3: Apply migration locally**

```bash
npx supabase db reset
```
Expected: migrations applied, seed categories inserted, no errors.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: initial database schema"
```

---

## Task 4: RLS Policies Migration

**Files:**
- Create: `supabase/migrations/20260419000002_rls.sql`

- [ ] **Step 1: Write RLS migration**

Create `supabase/migrations/20260419000002_rls.sql`:
```sql
-- Enable RLS on all user-scoped tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- accounts: users own their rows
CREATE POLICY "users_own_accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions: users own their rows
CREATE POLICY "users_own_transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- categories: users see system categories (user_id IS NULL) + their own
CREATE POLICY "users_see_own_and_system_categories"
  ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "users_manage_own_categories"
  ON categories FOR INSERT UPDATE DELETE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- budgets: users own their rows
CREATE POLICY "users_own_budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- savings_goals: users own their rows
CREATE POLICY "users_own_savings_goals"
  ON savings_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- recurring_transactions: users own their rows
CREATE POLICY "users_own_recurring"
  ON recurring_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- exchange_rates: public read, no user write (only service role via cron)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_public_read"
  ON exchange_rates FOR SELECT
  USING (true);
```

- [ ] **Step 2: Apply and verify**

```bash
npx supabase db reset
```
Expected: all policies applied, no errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add RLS policies for all tables"
```

---

## Task 5: Supabase Client Setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Write browser client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Write server client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Write auth middleware**

Create `middleware.ts` at project root:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isPublicPath && request.nextUrl.pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: Write test for middleware redirect logic**

Create `__tests__/middleware.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/callback",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

describe("middleware path matching", () => {
  it("marks auth paths as public", () => {
    expect(isPublicPath("/auth/login")).toBe(true);
    expect(isPublicPath("/auth/register")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("marks app paths as protected", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/accounts")).toBe(false);
    expect(isPublicPath("/transactions")).toBe(false);
    expect(isPublicPath("/log")).toBe(false);
  });
});
```

- [ ] **Step 5: Run test**

```bash
npm test -- __tests__/middleware.test.ts
```
Expected:
```
✓ middleware path matching > marks auth paths as public
✓ middleware path matching > marks app paths as protected
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: Supabase client setup and auth middleware"
```

---

## Task 6: TypeScript Entity Types

**Files:**
- Create: `lib/types/database.types.ts`

- [ ] **Step 1: Write entity types**

Create `lib/types/database.types.ts`:
```typescript
export type AccountType = "checking" | "savings" | "cash" | "ewallet";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type BudgetPeriod = "monthly" | "weekly";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type Currency = "USD" | "IDR";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  color: string;
  icon: string;
  is_archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  converted_amount_usd: number | null;
  category_id: string | null;
  notes: string | null;
  date: string;
  recurring_id: string | null;
  transfer_pair_id: string | null;
  is_opening_balance: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  deadline: string | null;
  color: string;
  icon: string;
  linked_account_id: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  transaction_template: Partial<Transaction>;
  frequency: RecurringFrequency;
  next_due_date: string;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  fetched_at: string;
}
```

- [ ] **Step 2: Write type smoke test**

Create `__tests__/lib/types.test.ts`:
```typescript
import { describe, it, expectTypeOf } from "vitest";
import type { Account, Transaction, Category } from "@/lib/types/database.types";

describe("database types", () => {
  it("Account has required fields", () => {
    expectTypeOf<Account>().toHaveProperty("id");
    expectTypeOf<Account>().toHaveProperty("balance");
    expectTypeOf<Account>().toHaveProperty("type");
  });

  it("Transaction has currency field", () => {
    expectTypeOf<Transaction>().toHaveProperty("currency");
    expectTypeOf<Transaction>().toHaveProperty("converted_amount_usd");
  });

  it("Category user_id can be null (system categories)", () => {
    expectTypeOf<Category["user_id"]>().toEqualTypeOf<string | null>();
  });
});
```

- [ ] **Step 3: Run test**

```bash
npm test -- __tests__/lib/types.test.ts
```
Expected:
```
✓ database types > Account has required fields
✓ database types > Transaction has currency field
✓ database types > Category user_id can be null (system categories)
Test Files  1 passed (1)
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: TypeScript entity types"
```

---

## Task 7: OAuth Callback Route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Write OAuth callback route**

Create `app/auth/callback/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: Supabase OAuth callback route"
```

---

## Task 8: Login Page

**Files:**
- Create: `components/auth/login-form.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `__tests__/components/auth/login-form.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/auth/login-form.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders Google sign-in button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("shows validation error when email is empty", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- __tests__/components/auth/login-form.test.tsx
```
Expected: FAIL — `LoginForm` not found.

- [ ] **Step 3: Write `components/auth/login-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to Moonlit</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials below</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <a href="/auth/register" className="underline underline-offset-4 hover:text-primary">
          Register
        </a>
        {" · "}
        <a href="/auth/forgot-password" className="underline underline-offset-4 hover:text-primary">
          Forgot password?
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Write `app/(auth)/login/page.tsx`**

```typescript
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test -- __tests__/components/auth/login-form.test.tsx
```
Expected:
```
✓ LoginForm > renders email and password fields
✓ LoginForm > renders Google sign-in button
✓ LoginForm > shows validation error when email is empty
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: login page with email/password and Google OAuth"
```

---

## Task 9: Register Page

**Files:**
- Create: `components/auth/register-form.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `__tests__/components/auth/register-form.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/auth/register-form.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RegisterForm } from "@/components/auth/register-form";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({ error: null, data: { user: {} } }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("RegisterForm", () => {
  it("renders name, email and password fields", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- __tests__/components/auth/register-form.test.tsx
```
Expected: FAIL — `RegisterForm` not found.

- [ ] **Step 3: Write `components/auth/register-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const registerSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center space-y-2">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link to your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start tracking your finances with Moonlit</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 8 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/auth/login" className="underline underline-offset-4 hover:text-primary">
          Sign in
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Write `app/(auth)/register/page.tsx`**

```typescript
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test -- __tests__/components/auth/register-form.test.tsx
```
Expected:
```
✓ RegisterForm > renders name, email and password fields
✓ RegisterForm > shows error when passwords do not match
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: register page with email verification"
```

---

## Task 10: Forgot Password Page

**Files:**
- Create: `components/auth/forgot-password-form.tsx`
- Create: `app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Write `components/auth/forgot-password-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center space-y-2">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          If that address is registered, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/auth/login" className="underline underline-offset-4 hover:text-primary">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/(auth)/forgot-password/page.tsx`**

```typescript
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <ForgotPasswordForm />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: forgot password page"
```

---

## Task 11: Dark/Light Mode Setup

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/globals.css` (update)

- [ ] **Step 1: Write root layout with ThemeProvider**

Replace `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moonlit",
  description: "Your personal finance tracker",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: dark/light mode with next-themes"
```

---

## Task 12: Sidebar Component

**Files:**
- Create: `components/layout/sidebar-nav-item.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `__tests__/components/layout/sidebar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/layout/sidebar.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "@/components/layout/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

describe("Sidebar", () => {
  it("renders all nav items", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accounts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /transactions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /budgets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("collapses to icon-only when toggle is clicked", async () => {
    render(<Sidebar />);
    const user = userEvent.setup();
    const labels = screen.getAllByText(/dashboard|accounts|transactions|budgets|settings/i);
    expect(labels.length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /collapse/i }));
    // Labels removed from DOM in collapsed mode (conditional render)
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- __tests__/components/layout/sidebar.test.tsx
```
Expected: FAIL — `Sidebar` not found.

- [ ] **Step 3: Write `components/layout/sidebar-nav-item.tsx`**

```typescript
"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
}: SidebarNavItemProps) {
  const item = (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isCollapsed ? "justify-center" : "",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{item}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return item;
}
```

- [ ] **Step 4: Write `components/layout/sidebar.tsx`**

```typescript
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarNavItem } from "./sidebar-nav-item";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/accounts", icon: CreditCard, label: "Accounts" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/budgets", icon: PiggyBank, label: "Budgets" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 px-3 border-b", collapsed ? "justify-center" : "gap-2")}>
        {!collapsed && (
          <span className="font-semibold tracking-tight text-base">Moonlit</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 ml-auto"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
            isCollapsed={collapsed}
          />
        ))}
      </nav>

      <Separator />

      {/* Bottom: theme toggle + sign out */}
      <div className="p-2 flex flex-col gap-1">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn("w-full", !collapsed && "justify-start gap-3 px-3")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn("w-full", !collapsed && "justify-start gap-3 px-3")}
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground">Sign out</span>
          )}
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test -- __tests__/components/layout/sidebar.test.tsx
```
Expected:
```
✓ Sidebar > renders all nav items
✓ Sidebar > collapses to icon-only when toggle is clicked
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: collapsible sidebar with nav and theme toggle"
```

---

## Task 13: Bottom Nav + FAB

**Files:**
- Create: `components/layout/bottom-nav.tsx`
- Create: `components/layout/fab.tsx`
- Create: `__tests__/components/layout/bottom-nav.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/layout/bottom-nav.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "@/components/layout/bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("BottomNav", () => {
  it("renders 5 nav items", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("marks the active route", () => {
    render(<BottomNav />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("text-foreground");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- __tests__/components/layout/bottom-nav.test.tsx
```
Expected: FAIL — `BottomNav` not found.

- [ ] **Step 3: Write `components/layout/bottom-nav.tsx`**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  PiggyBank,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/accounts", icon: CreditCard, label: "Accounts" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/budgets", icon: PiggyBank, label: "Budgets" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Write `components/layout/fab.tsx`**

```typescript
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FAB() {
  return (
    <Link
      href="/log"
      className="md:hidden fixed bottom-20 right-4 z-50"
      aria-label="Log transaction"
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test -- __tests__/components/layout/bottom-nav.test.tsx
```
Expected:
```
✓ BottomNav > renders 5 nav items
✓ BottomNav > marks the active route
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: mobile bottom nav and FAB"
```

---

## Task 14: App Shell Layout + TanStack Query Provider

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/page.tsx`

- [ ] **Step 1: Write `app/(app)/layout.tsx`**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FAB } from "@/components/layout/fab";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <FAB />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Write `app/(app)/page.tsx`**

```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your financial overview — coming in Plan 3.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: app shell layout with sidebar, bottom nav, and TanStack Query"
```

---

## Task 15: PWA Setup

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.ts` (already done in Task 1)

- [ ] **Step 1: Write `public/manifest.json`**

```json
{
  "name": "Moonlit",
  "short_name": "Moonlit",
  "description": "Your personal finance tracker",
  "start_url": "/log",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0a0a0a",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Add placeholder PWA icons**

Create two placeholder PNG files (192×192 and 512×512) at `public/icons/`. Any PNG will work for dev; replace with real branding before launch.

```bash
# Create placeholder icons using ImageMagick (if available), or just copy any PNG
# The app will work without real icons in development
mkdir -p public/icons
# If you have ImageMagick:
convert -size 192x192 xc:#6366f1 -fill white -draw "text 70,110 'M'" public/icons/icon-192.png
convert -size 512x512 xc:#6366f1 -fill white -draw "text 190,290 'M'" public/icons/icon-512.png
```

- [ ] **Step 3: Write `/log` placeholder route**

Create `app/log/page.tsx`:
```typescript
export default function LogPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold">Log Transaction</h1>
        <p className="text-sm text-muted-foreground">
          Transaction logger — coming in Plan 2.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: PWA manifest and log route placeholder"
```

---

## Task 16: E2E Auth Flow Tests

**Files:**
- Create: `e2e/auth.spec.ts`
- Create: `e2e/navigation.spec.ts`

- [ ] **Step 1: Write auth E2E spec**

Create `e2e/auth.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test+${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";

test.describe("Auth flow", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows validation error for invalid email on login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("shows validation error when passwords don't match on register", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByLabel(/^password/i).fill("password123");
    await page.getByLabel(/confirm/i).fill("different");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Write navigation E2E spec**

Create `e2e/navigation.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

// Note: these tests require a seeded test user in local Supabase.
// Run: npx supabase db reset && create a user via the Supabase dashboard at http://localhost:54323

test.describe("App navigation (requires authenticated session)", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in programmatically via the UI
    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL ?? "test@example.com");
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD ?? "password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
  });

  test("dashboard is accessible after login", async ({ page }) => {
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("sidebar contains all nav links on desktop", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /accounts/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /transactions/i }).first()).toBeVisible();
  });
});
```

- [ ] **Step 3: Run E2E tests (auth validation only — no real Supabase needed)**

```bash
npm run dev &
npx playwright test e2e/auth.spec.ts --project=chromium
```
Expected: first 5 tests pass (redirect to login, page renders, validation errors). Navigation tests will be skipped until a test user exists.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: E2E specs for auth flow and navigation"
```

---

## Task 17: Final Verification

- [ ] **Step 1: Run all unit tests**

```bash
npm test
```
Expected:
```
✓ __tests__/smoke.test.ts
✓ __tests__/middleware.test.ts
✓ __tests__/lib/types.test.ts
✓ __tests__/components/auth/login-form.test.tsx
✓ __tests__/components/auth/register-form.test.tsx
✓ __tests__/components/layout/sidebar.test.tsx
✓ __tests__/components/layout/bottom-nav.test.tsx
Test Files  7 passed (7)
```

- [ ] **Step 2: Start dev server and verify app loads**

```bash
npm run dev
```
Open `http://localhost:3000` — should redirect to `/auth/login`. Verify:
- Login form renders
- "Continue with Google" button visible
- `/auth/register` shows register form
- `/auth/forgot-password` shows reset form
- Theme toggle (light/dark) works

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: Plan 1 complete — foundation, auth, app shell, PWA"
```

---

## What's Next

- **Plan 2:** Accounts CRUD, Transactions CRUD, Transaction Logger (`/log`) with 2-tap entry, split transactions, currency selection
- **Plan 3:** Dashboard with all 6 charts, per-chart range selectors, Financial Health Score
- **Plan 4:** Budgets, Savings Goals, Settings, Exchange Rate Cron, Privacy Mode
