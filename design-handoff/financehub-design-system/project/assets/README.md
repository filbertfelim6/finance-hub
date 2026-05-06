# Assets

## Logo

| File | Use |
|---|---|
| `logo.svg` | Light surfaces (cream, white). Default. |
| `logo-dark.svg` | Dark surfaces (forest neutrals). |
| `logo-mark.svg` | Square mark only — favicons, app icons, avatar slots. |

The wordmark uses **Fraunces** at 28px / weight 600 / letter-spacing -0.01em. "Hub" is set in `--green-500`. The mark is two stylized leaves forming an upward calm shape — calm growth.

> **Min size:** 20px height for the mark, 28px height for the full logo. Below that, use the mark.
> **Clear space:** at least the height of the mark on all sides.

## Icons

We use **Lucide** (https://lucide.dev) loaded from CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

Then in markup:

```html
<i data-lucide="wallet"></i>
```

Sizes: 20px in sidebar nav, 16px in dense table cells, 24px in empty/onboarding states. Stroke-width is Lucide's default 2 — already calm, no need to override.

> **Substitution flag:** Lucide is a substitution — no custom icon set was supplied. If FinanceHub ships its own icons, drop them as SVGs into this folder and we'll switch.

## Photography (when added)

Photographs should be:
- Warm-toned, slightly desaturated, slight grain
- Indoor light; subjects like plants, paper, ceramics, light-wood textures
- Never people-on-stock-photos with faux-finance handshakes
- Crop tight; let texture matter more than subject
