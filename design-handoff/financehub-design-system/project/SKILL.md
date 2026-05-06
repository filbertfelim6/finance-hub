---
name: financehub-design
description: Use this skill to generate well-branded interfaces and assets for FinanceHub, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping FinanceHub's financial tracker, portfolio, recommendations, and AI assistant surfaces.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map

- `README.md` — full system: voice, content, color, type, motion, iconography, and an index of every other file
- `colors_and_type.css` — single source of truth for every CSS variable (color, type, spacing, radii, shadow, motion). Import this in any HTML you generate.
- `assets/logo.svg` / `logo-dark.svg` / `logo-mark.svg` — wordmark + mark
- `assets/README.md` — icon and logo usage rules
- `preview/*.html` — small reference cards showing every primitive (type, colors, spacing, components)
- `ui_kits/finance_app/` — full click-thru recreation of the FinanceHub web app (Sidebar, Dashboard, Accounts, Transactions, Portfolio, ChatPanel). Lift components from here when building app-shaped surfaces.

## Non-negotiables

- Use sage green (`--green-500` / `#5a7a4e`) for brand and CTAs. Never neon-fintech-violet.
- Linen surface (`--cream-50` = `#efece4` page, `#fff` cards) in light. Warm forest neutrals in dark — never `#000`.
- Tabular figures (`font-feature-settings: "tnum"`) on every monetary number.
- Real minus (`−`, U+2212), not a hyphen, for negatives.
- No emoji in product chrome.
- Lucide icons only (or copy the user's icon set if they ship one).
- Sentence case, second person ("you / your"), composed tone — never alarmed.
