# FinanceHub — Web App UI Kit

A click-thru recreation of the FinanceHub web app: sidebar nav + Dashboard / Accounts / Transactions / Portfolio / Ask AI.

The visual treatment is sage-green-on-cream (per brand direction). Layout, IA, and component shapes are lifted from the reference Moonlit screenshots: collapsible sidebar with a primary CTA at top, period selector pills (`7D / 30D / 90D / 1Y / Custom`), big tabular-figure totals, multi-currency account cards, grouped transaction list.

## Files

- `index.html` — entry. Renders `App.jsx` with a working sidebar, view-switching, and a few interactive moments (theme toggle, period switch, search filter, sending an AI message).
- `App.jsx` — top-level shell + view router
- `Sidebar.jsx` — left nav with collapse + primary CTA
- `Dashboard.jsx` — net worth + period summary + charts
- `Accounts.jsx` — multi-currency account grid
- `Transactions.jsx` — grouped, filterable transaction list
- `Portfolio.jsx` — holdings table + allocation donut
- `ChatPanel.jsx` — AI chat panel (live; uses `window.claude.complete`)
- `Controls.jsx` — Button, Pill, PeriodSelector, Chip, IconTile, Card primitives
- `Charts.jsx` — NetWorthArea, IncomeExpenseBars, CategoryDonut (inline SVG)

## Caveats

- No source code or Figma was supplied — components are recreations from the screenshots, not source-of-truth replicas.
- Iconography is Lucide (CDN substitution).
- Numbers and account names are realistic placeholders. The Portfolio and Ask AI surfaces don't appear in the references — they're net-new but follow the system.
