# FinanceHub Design System

> All-in-one financial management — tracker, portfolio, recommendations, AI assistant.
> A calm place to look at your money.

---

## What FinanceHub is

FinanceHub is being built as a unified personal-finance product that consolidates several jobs:

1. **Financial tracker** — accounts, transactions, budgets, net worth over time
2. **Investment portfolio management** — holdings, allocation, performance
3. **Recommendation engine** *(planned)* — surface insights, nudges, anomalies
4. **AI chatbot** *(planned)* — natural-language assistant grounded in the user's actual transactions and portfolio

The product targets multi-currency users (the reference screenshots show IDR, USD, JPY side-by-side), so currency-agnostic patterns and tabular figures matter.

## Design north-star

> Money is emotional. Our job is to make the numbers legible and the experience feel composed.

The visual language is built around **warm sage green on warm linen** (`#efece4` page, pure white cards). Linen is warm enough to feel non-clinical, but a clear step away from the editorial-cream we explored first. We avoid the two clichés of finance UI — neon-fintech-violet, and panicky red/green dashboards — in favor of a low-saturation, almost-editorial calm. Greens are dialed back toward moss/forest. Reds are dialed back toward terracotta. The mood is closer to a quiet study than a trading floor.

---

## Sources

The system was bootstrapped from these inputs:

- **5 product screenshots** (light + dark) of an existing prototype branded "Moonlit" — provided as `uploads/Screenshot 2026-04-28 at 7.27.*.png`. These show: Dashboard (net worth, period summary, charts), Accounts (multi-currency cards), Transactions (filterable list).
- **User-supplied direction:** "warm, related to green or soft dark green ... brings calmness and composure ... keep the user's emotion as composed as possible."

> The screenshots were used for **layout and information-architecture reference only.** The visual treatment (color, type, motif) has been redirected from the original Moonlit terra-cotta-on-cream toward the calm-green direction the user requested. Where the original used burnt-orange as the active/CTA color, we now use sage green; cream surfaces are kept because they reinforce calmness.

No codebase or Figma was attached. If a real codebase exists, please share it via the Import menu — UI components in `ui_kits/` are currently visual recreations driven by the screenshots and would be much higher-fidelity with source code.

---

## CONTENT FUNDAMENTALS

The product talks to people about their money. Tone matters more than almost anywhere else in software.

### Voice

- **Composed, never alarmed.** Even when the numbers are bad, the copy stays even. "You've spent more than usual on dining this week" — not "⚠️ Over budget!"
- **Specific over generic.** "Rp 1,869,672,160 across 24 transactions" beats "Lots of activity."
- **Quietly knowledgeable.** Like a friend who happens to be good with money — not a finance bro and not a chatbot. Avoid "Let's crush your goals!" energy.
- **Plain English first.** "Money in / money out" before "Inflows / outflows." If a technical term is needed (APR, P/L, rebalance), define it inline the first time.

### Person & casing

- **You / your.** Always second person. "Your net worth," "your accounts." Never "the user."
- **We** is fine when describing what FinanceHub does, used sparingly. "We've grouped these by category."
- **Sentence case** for everything — UI labels, headings, buttons. Title Case is reserved for proper nouns (account names, "USD Savings").
- **No exclamation marks** in core UI. They read as performative. Allowed in onboarding success states, sparingly.

### Numbers, currency, dates

- **Always tabular figures.** `font-feature-settings: "tnum"` is on by default for monetary values.
- **Currency follows locale.** `Rp 5.507.086.769` (IDR uses `.` as thousands separator and no decimals). `$83,678.18` (USD). `¥40,000,000` (JPY, no decimals). The screenshots respect this — we do too.
- **Negatives use a real minus** (`−`, U+2212), not a hyphen, and are colored with the calm "bad" tone (terracotta, not red).
- **Dates:** `Sun, 26 Apr 2026` for grouped lists; `26 Apr` short form in compact contexts; `mm/dd/yyyy` only when the user types into a date input.
- **Big rounded summaries** (Net Worth, Total) skip currency decimals when the rounding error is < 0.01%. Detailed rows keep them.

### Microcopy examples

| Surface | Yes | No |
|---|---|---|
| Empty state — transactions | "No transactions yet. Log your first one to start the picture." | "Oops! It's empty here 🥲" |
| CTA — primary | "Log transaction" | "+ Add new transaction now" |
| Error — failed sync | "Couldn't reach Mandiri. We'll try again in a minute." | "Error: connection failed (502)" |
| Insight — overspend | "Dining is up 32% from your 90-day average." | "⚠️ Warning: dining out of budget!!" |
| AI chat — clarifying | "Do you mean the JPY savings account, or the JPY portfolio?" | "I need more info to answer that." |

### Emoji & punctuation

- **No emoji in product chrome, ever.** Status, dashboards, notifications stay text-only. Account icons are the bank's mark or a neutral glyph from our icon set, not 💰.
- **Em dash —** preferred for asides. Avoid the Oxford-comma debate by writing shorter lists.
- **Curly quotes** in long-form copy (insights, AI replies). Straight quotes in code/identifiers.

---

## VISUAL FOUNDATIONS

### Color

The system runs on **two palettes layered over each other**:

- A **warm-linen surface system** (`--cream-50` = `#efece4` page, `--cream-100` sunken, plus pure white for raised cards) gives the product its non-clinical, lived-in feel without leaning editorial. *(Token names kept as `--cream-*` for stability; the values are now Linen.)*
- A **sage / moss / forest scale** (`--green-50` → `--green-950`, primary `--green-500`) is used for brand, CTAs, active states, positive deltas, brand chrome.
- Semantic colors are deliberately **desaturated** — `--good-500` is sage, `--bad-500` is terracotta-rose, `--warn-500` is warm amber. We never use a 100%-saturated red. (The reference shot does, in the transaction list — we step that back.)
- A **6-color data-viz palette** rotates moss / amber / terracotta / slate / mauve / light-moss. All low-sat, all harmonious on cream.
- **Dark mode** swaps cream for warm forest neutrals (`--night-950` is `#0e120c`, never `#000`). The reference dark screenshots already do this — we keep it.

See `colors_and_type.css` for every token.

### Typography

| Role | Family | Notes |
|---|---|---|
| UI / body | **Inter Tight** | Tight, modern, holds up at 11px in tables. `tnum` on by default. |
| Display / editorial | **Fraunces** | Used sparingly — onboarding heroes, marketing, AI chat opener |
| Mono / data | **JetBrains Mono** | Codes, identifiers, AI-chat code blocks |

> **Substitution flag:** No font files were supplied. We are loading Inter Tight, Fraunces, and JetBrains Mono from Google Fonts as the closest neutral picks. If FinanceHub has a brand typeface (or licensed copies of these), please share the `.woff2` files and we'll move the imports to `fonts/`.

Big monetary figures use a `.fh-figure` class with tabular & lining figures locked on. There is no Inter "Roboto Mono"-style hack — we keep ascenders consistent so `Rp 5.507.086.769` doesn't dance.

### Spacing & layout

- **4-px base grid.** All spacing tokens are multiples of 4. Common rhythms: 8 (intra-component), 16 (component padding), 24 (between cards), 40+ (between sections).
- **Page max-width** is intentionally wide (1440px) — finance dashboards are dense and breathe better than they squeeze.
- **Sidebar nav** is fixed-width 224px, can collapse to 64px (icon-only). The reference shows both states.
- **Card grids** use 12-column with 24px gutters at desktop; collapse to 1-column on mobile.

### Backgrounds, imagery, motifs

- **Surfaces are flat.** Cream page → white card. No gradients on surfaces. No noise textures.
- **No hand-drawn illustrations.** No spot illustrations of "a happy person looking at their wallet." Money UI gets less trustworthy when it gets cute.
- **Imagery, when used** (marketing, onboarding hero), is photographic, warm-toned, slightly desaturated, slight grain. Indoor light, plants, paper. Never stock-photo handshakes.
- **Charts are the visual centerpiece.** They use the data-viz palette with **stacked area fills at 22% opacity** over a 1.5px stroke (see Net Worth chart in the reference). Gridlines are `--border-soft`, never solid black.

### Borders, shadows, elevation

- **Borders** are color-mixed against `--ink-900` at 8% / 14% / 24% — they sit warm against cream and don't look gray.
- **Shadows are very soft, slightly warm.** `--shadow-md` is the default for raised cards (4px / 12px blur, 8% alpha). We don't use harsh dropshadows or "neumorphism."
- **Inner shadow** (`--shadow-inset`) gives buttons a 1px top highlight for that subtly-dimensional finance-app feel.
- **Cards** = `--bg-surface` (white in light, `--night-900` in dark) + `--shadow-sm` + 1px `--border-soft` + `--radius-lg` (14px). Full stop. Don't invent new card treatments.

### Corner radii

- **14px** is the workhorse — cards, chart containers, account tiles
- **10px** for inputs, buttons (medium)
- **6px** for chips, tags, dense rows
- **999px (pill)** for filter chips, segmented controls, the period selector (`7D / 30D / 90D / 1Y`)

### Hover, press, focus

- **Hover** — non-CTA elements darken background by ~3% (toward `--cream-100`). CTAs darken brand toward `--brand-hover` (`--green-600`).
- **Press** — additional darken (`--brand-press`, `--green-700`) + `transform: translateY(1px)` on buttons. No "shrink to 95%" — that reads as toy-like.
- **Focus** — 2px outline of `--focus-ring` at 35% opacity, offset 2px. Never removed.
- **Disabled** — 40% opacity, no pointer events. We don't gray out independently.

### Motion

- **Default duration:** 200ms (`--dur-base`). Fast enough to feel responsive, slow enough to read as intentional.
- **Easing:** `--ease-out` for entrances; `--ease-in-out` for state changes; `--ease-spring` only on confirmation moments (e.g., savings goal hit).
- **No bounces in core UI.** Bounces sit oddly with money.
- **Page / route changes** cross-fade in 320ms. Charts animate their `path` over 600ms with `--ease-out`.

### Transparency & blur

- **Backdrop blur** is reserved for the sticky top of long scroll views (transactions list) and modal scrims. 12px blur + 70% surface tint.
- We don't lean on glassy panels. Cream + white is enough.

### Dark mode

- Backgrounds are warm forest, never #000.
- Brand color **lightens** to `--green-400` so it stays readable on dark surfaces.
- Borders are `#ece8d8` mixed at 8/14/22%.
- Charts keep the same hues — they're already low-sat enough to work both ways.

---

## ICONOGRAPHY

- **Library:** **Lucide** (CDN-loaded). Stroke-based, 1.5px weight, rounded joins. It matches the calm composed feel and works in both themes without recoloring.
  - Loaded via: `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`.
  - Default size 20px in nav, 16px in dense table cells, 24px in onboarding/empty states.
- **Substitution flag:** This is a CDN substitution — no icon set was provided. If FinanceHub has a custom icon library, drop the SVGs in `assets/icons/` and we'll switch.
- **Logo:** A custom wordmark + leaf-mark sits in `assets/logo.svg` (and inverted variant `logo-dark.svg`). The mark is two stylized leaves forming an upward shape — calm growth, not a rocket.
- **Account / category icons:** small rounded-square tiles (32×32) with a tinted background and a Lucide glyph in the brand color. See the reference Accounts screen — same pattern.
- **Emoji:** never. Not in chrome, not in empty states, not in toasts.
- **Unicode glyphs** allowed: `−` (minus), `→` (action), `·` (separator), `…` (truncation), `⌘` / `⌥` (keyboard hints).

---

## INDEX — what's in this folder

```
README.md                  ← you are here
SKILL.md                   ← agent skill manifest (Claude Code-compatible)
colors_and_type.css        ← all CSS variables (color, type, spacing, radii, motion)
assets/
  logo.svg                 ← FinanceHub wordmark + leaf-mark, light bg
  logo-dark.svg            ← inverted variant for dark surfaces
  logo-mark.svg            ← square mark only, no wordmark
  README.md                ← icon and asset usage notes
preview/                   ← cards rendered in the Design System tab
  type-display.html, type-headings.html, type-body.html, type-figure.html
  colors-brand.html, colors-cream.html, colors-semantic.html, colors-viz.html
  spacing.html, radii.html, shadows.html
  buttons.html, inputs.html, cards.html, badges.html, sidebar.html
  logo.html
ui_kits/
  finance_app/             ← the FinanceHub web app UI kit
    README.md
    index.html             ← interactive click-thru prototype
    *.jsx                  ← Sidebar, Dashboard, Accounts, Transactions, ChatPanel, etc.
fonts/                     ← reserved for licensed font files (currently empty — using Google Fonts CDN)
```

### Quick links

- **Want a button or input?** → `preview/buttons.html`, `preview/inputs.html`, or `ui_kits/finance_app/Controls.jsx`
- **Want to mock a full screen?** → start from `ui_kits/finance_app/index.html` and remix
- **Want the colors as JSON / Tailwind?** → grab them from `colors_and_type.css` (single source of truth)
