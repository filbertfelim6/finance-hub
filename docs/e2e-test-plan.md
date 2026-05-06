# E2E Test Plan — FinanceHub

**Tool:** Playwright MCP  
**Starting state:** Empty database (no accounts, transactions, categories beyond system defaults)  
**Base URL:** http://localhost:3000

---

## Execution Order

Tests are ordered so each suite builds on state created by the previous ones. Do not shuffle suites.

---

## Suite 1 — Authentication

### T1.1 Login
1. Navigate to `/auth/login`
2. Enter valid email + password
3. Click Sign In
4. **Expect:** Redirect to `/` (dashboard)
5. **Expect:** Dashboard page visible with "No accounts yet" empty state

### T1.2 Unauthenticated redirect
1. Open a new tab, navigate directly to `/accounts`
2. **Expect:** Redirect to `/auth/login`

---

## Suite 2 — Accounts (empty → populated)

### T2.1 Empty state
1. Navigate to `/accounts`
2. **Expect:** Empty state message visible ("No accounts yet" or similar)
3. **Expect:** "Add account" button present

### T2.2 Create first account (Cash / IDR)
1. Click "Add account"
2. Fill in:
   - Name: `Cash`
   - Type: `Cash`
   - Currency: `IDR`
   - Balance: `500000`
   - Color: leave default
3. Submit
4. **Expect:** Toast "Account created"
5. **Expect:** Account card appears on page with name "Cash" and balance shown

### T2.3 Create second account (Bank / USD)
1. Click "Add account"
2. Fill in:
   - Name: `BCA Savings`
   - Type: `Bank`
   - Currency: `USD`
   - Balance: `1000`
3. Submit
4. **Expect:** Two account cards on page

### T2.4 Edit an account
1. Click edit icon on the "Cash" account card
2. Change the name to `Cash Wallet`
3. Submit
4. **Expect:** Toast "Account updated"
5. **Expect:** Card label updated to "Cash Wallet"

### T2.5 Navigate to account detail
1. Click on the "Cash Wallet" account card
2. **Expect:** URL changes to `/accounts/[id]`
3. **Expect:** Account name and balance visible in header
4. **Expect:** Empty transaction list (no transactions yet)

---

## Suite 3 — Log Transactions

### T3.1 Log an income (salary → Cash Wallet)
1. Navigate to `/log`
2. Select type: **Income**
3. Enter amount: `3000000`, currency: `IDR`
4. Select category: `Salary` (or any income category)
5. Select account: `Cash Wallet`
6. Set date: today, notes: `Monthly salary`
7. Submit
8. **Expect:** Toast "Transaction logged" (or similar success)
9. **Expect:** Redirected away from `/log` or form resets

### T3.2 Log an expense (single category)
1. Navigate to `/log`
2. Select type: **Expense**
3. Enter amount: `50000`, currency: `IDR`
4. Select category: `Food & Dining` (or any expense category)
5. Select account: `Cash Wallet`
6. Set date: today, notes: `Lunch`
7. Submit
8. **Expect:** Toast success

### T3.3 Log an expense with split categories
1. Navigate to `/log`
2. Select type: **Expense**
3. Enter amount: `200000`, currency: `IDR`
4. On the category step, enable **Split** mode
5. Add two splits:
   - `100000` → `Food & Dining`
   - `100000` → `Transport`
6. Select account: `Cash Wallet`
7. Submit
8. **Expect:** Toast success

### T3.4 Log a transfer (Cash Wallet → BCA Savings)
1. Navigate to `/log`
2. Select type: **Transfer**
3. Select source account: `Cash Wallet`
4. Select destination account: `BCA Savings`
5. Enter amount: `100000` IDR (source currency)
6. Set date: today
7. Submit
8. **Expect:** Toast success
9. **Expect:** Balance on Cash Wallet decreased; BCA Savings balance increased

### T3.5 Log a backdated expense
1. Navigate to `/log`
2. Select type: **Expense**
3. Enter amount: `25000`, currency: `IDR`
4. Select category: `Transport`
5. Select account: `Cash Wallet`
6. Set date: 7 days ago
7. Submit
8. **Expect:** Toast success

---

## Suite 4 — Transactions Page

### T4.1 View all transactions
1. Navigate to `/transactions`
2. **Expect:** All 5 transactions from Suite 3 visible
3. **Expect:** Each row shows date, type, amount, category, account

### T4.2 Filter by type
1. Open the type filter, select **Expense**
2. **Expect:** Only expense transactions shown (T3.2, T3.3, T3.5)

### T4.3 Filter by account
1. Clear type filter; open account filter, select **Cash Wallet**
2. **Expect:** Only transactions for Cash Wallet shown

### T4.4 Export CSV
1. Clear all filters
2. Click **Export CSV**
3. **Expect:** File download triggered (`.csv`)

---

## Suite 5 — Dashboard

### T5.1 Charts render with data
1. Navigate to `/`
2. **Expect:** "No accounts yet" empty state is gone
3. **Expect:** Net Worth value displayed in header (non-zero)
4. **Expect:** KPI strip shows Income, Expenses, Savings Rate values
5. **Expect:** At least one chart visible (not all showing empty state)

### T5.2 Privacy mode
1. Click the eye icon (toggle privacy on)
2. **Expect:** Net worth shows `••••••`
3. **Expect:** KPI values show `••••`
4. Click the eye icon again (toggle off)
5. **Expect:** Values restored

### T5.3 Display currency switch
1. Change display currency from `IDR` to `USD`
2. **Expect:** Net worth reformatted as USD amount
3. Switch back to `IDR`

### T5.4 Period range selector
1. Change KPI range to **90D**
2. **Expect:** KPI values update (may or may not change depending on test data dates)
3. Change to **Custom**, enter a date range covering today
4. **Expect:** KPI values update without error

### T5.5 Transactions shortcut
1. Click **Transactions →** link near Period Summary
2. **Expect:** Navigate to `/transactions`

---

## Suite 6 — Budgets

### T6.1 Empty state
1. Navigate to `/budgets`
2. **Expect:** Empty state message visible
3. **Expect:** Plan tabs (`Budgets | Goals | Subscriptions`) visible

### T6.2 Create a budget
1. Click "Add Budget"
2. Fill in:
   - Category: `Food & Dining`
   - Amount: `500000`
   - Currency: `IDR`
   - Period: `Monthly`
3. Submit
4. **Expect:** Toast success
5. **Expect:** Budget card appears with progress bar
6. **Expect:** Progress bar is non-zero (because T3.2 and one split from T3.3 already spent on Food & Dining)

### T6.3 Summary strip shows totals
1. **Expect:** "Total Spent" and "Total Budgeted" strip visible at top

### T6.4 Edit a budget
1. Click edit (three-dot menu) on the budget card → Edit
2. Change amount to `800000`
3. Submit
4. **Expect:** Toast success
5. **Expect:** Budget card updated

### T6.5 Delete a budget
1. Click three-dot menu → Delete
2. **Expect:** Toast "Budget deleted"
3. **Expect:** Card removed; empty state reappears

---

## Suite 7 — Goals

### T7.1 Empty state
1. Click **Goals** tab in Plan tabs
2. **Expect:** URL → `/goals`, empty state visible

### T7.2 Create a goal
1. Click "Add Goal"
2. Fill in:
   - Name: `Emergency Fund`
   - Target amount: `10000000`
   - Currency: `IDR`
   - Deadline: 6 months from today
   - Color: choose any
   - Icon: choose any
3. Submit
4. **Expect:** Toast success
5. **Expect:** Goal card appears with circular progress ring at 0%

### T7.3 Add a contribution
1. On the goal card, click **+ Contribute**
2. Enter amount: `500000`
3. Confirm
4. **Expect:** Progress ring increases
5. **Expect:** Current amount shown updated

### T7.4 Edit a goal
1. Click three-dot menu → Edit
2. Change name to `Emergency Fund 2025`
3. Submit
4. **Expect:** Toast success; card name updated

### T7.5 Delete a goal
1. Click three-dot menu → Delete
2. **Expect:** Toast success; card removed

---

## Suite 8 — Subscriptions

### T8.1 Empty state
1. Click **Subscriptions** tab in Plan tabs
2. **Expect:** URL → `/subscriptions`, empty state visible

### T8.2 Create a subscription
1. Click "Add"
2. Fill in:
   - Name/notes: `Netflix`
   - Amount: `150000`
   - Currency: `IDR`
   - Category: `Entertainment` (or any)
   - Frequency: `Monthly`
   - Next due date: next month
3. Submit
4. **Expect:** Toast success
5. **Expect:** Subscription card visible

### T8.3 Edit a subscription
1. Click edit on the card
2. Change amount to `180000`
3. Submit
4. **Expect:** Toast success; amount updated

### T8.4 Delete a subscription
1. Click delete on the card
2. **Expect:** Toast success; card removed

---

## Suite 9 — Settings

### T9.1 Theme toggle
1. Navigate to `/settings`
2. Click **Dark** theme button
3. **Expect:** UI switches to dark mode
4. Click **System** to restore

### T9.2 Privacy mode toggle
1. Toggle the Privacy Mode switch ON
2. Navigate to `/` (dashboard)
3. **Expect:** Net worth shows `••••••`
4. Return to `/settings`, toggle Privacy Mode OFF

### T9.3 Display currency persists
1. In Settings, change display currency to `SGD`
2. Navigate to `/` (dashboard)
3. **Expect:** Net worth shown in SGD
4. Return to Settings, change back to `IDR`

### T9.4 Add a custom category
1. In Settings → Categories, make sure **Expense** tab is selected
2. Click "Add category"
3. Enter name: `Pet Care`
4. Select an icon and color
5. Click Add
6. **Expect:** Toast success
7. **Expect:** `Pet Care` appears in the expense category list

### T9.5 Edit a custom category
1. Click edit on `Pet Care`
2. Change name to `Pets`
3. Click Save
4. **Expect:** Toast success; name updated in list

### T9.6 Verify custom category in log form
1. Navigate to `/log`
2. Select type: Expense
3. Enter amount, proceed to category step
4. **Expect:** `Pets` category is visible in the picker

### T9.7 Delete a custom category
1. Return to `/settings`
2. Click delete on `Pets`
3. Confirm dialog
4. **Expect:** Toast success; `Pets` removed from list

### T9.8 System categories are read-only
1. In Settings → Categories, find any system category (e.g., `Food & Dining`)
2. **Expect:** No edit or delete buttons visible for system categories

### T9.9 Sign out
1. Click **Sign out**
2. **Expect:** Redirect to `/auth/login`
3. **Expect:** Navigating to `/` redirects back to `/auth/login`

---

## Suite 10 — Navigation & Layout

### T10.1 Sidebar navigation (desktop)
1. At desktop viewport (≥ 1024px)
2. Click each sidebar item: Dashboard, Accounts, Plan, Settings
3. **Expect:** Correct page loads; active item highlighted

### T10.2 Plan item active state
1. Navigate to `/budgets` → **Expect:** Plan highlighted in sidebar/bottom-nav
2. Navigate to `/goals` → **Expect:** Plan still highlighted
3. Navigate to `/subscriptions` → **Expect:** Plan still highlighted

### T10.3 Bottom nav (mobile)
1. Set viewport to 390×844 (iPhone)
2. **Expect:** Bottom nav visible, sidebar hidden
3. Tap each bottom-nav item: Home, Accounts, [+], Plan, Settings
4. **Expect:** [+] navigates to `/log`
5. **Expect:** Correct pages load for each tab

### T10.4 Plan tabs
1. Navigate to `/budgets`
2. **Expect:** `Budgets | Goals | Subscriptions` tab row visible
3. Click **Goals** tab → **Expect:** URL → `/goals`, Goals tab highlighted
4. Click **Subscriptions** tab → **Expect:** URL → `/subscriptions`

### T10.5 Account detail back navigation
1. Navigate to `/accounts`
2. Click an account card
3. **Expect:** Account detail page loads
4. Click back button
5. **Expect:** Returns to `/accounts`

### T10.6 Sidebar collapse (desktop)
1. At desktop viewport, click the collapse button on the sidebar
2. **Expect:** Sidebar shrinks to icon-only width
3. **Expect:** Nav labels hidden, icons still visible and clickable
4. Click expand button → sidebar restores

---

## Notes for Execution

- **Login credentials:** Use the test account — supply credentials before running Suite 1
- **Database cleanup:** Between full test runs, the database needs to be reset (or use a dedicated test user)
- **Locale:** Some amounts use IDR formatting — `Rp 500.000` style; match accordingly in assertions
- **Charts:** Assert charts container is present and non-empty, not pixel-perfect rendering
- **Toasts:** Toast messages disappear quickly — assert immediately after action
