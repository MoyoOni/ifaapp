# Ìlú Àṣẹ Theme System — Color Guide

**Rewritten September 18, 2026:** this doc previously described an Orisha-based multi-theme system (Osun Gold, Ogun Iron, Shango Thunder, Yemoja Ocean, Oshun Forest, a theme selector in the header, a `src/lib/tailwind/orisha-colors.ts` file). None of that exists in the current codebase — no orisha-specific color tokens, no theme selector, no such file anywhere in `frontend/src`. What actually exists is a generic semantic-token palette (light/dark, no per-Orisha variants). Rewritten below to match reality; if Orisha-themed styling is still a design goal, it hasn't been built yet and would need to start from what's documented here.

## Overview

Colors are defined once as CSS custom properties in `frontend/src/index.css` (HSL triplets, no `hsl()` wrapper — Tailwind adds that), then exposed as Tailwind utility classes via `frontend/tailwind.config.js`. Components use the Tailwind classes (`bg-primary`, `text-destructive`, etc.), never raw hex/HSL values directly — that indirection is what makes light/dark mode and any future re-theming work without touching component code.

## Current tokens

| Token | Light | Dark | Tailwind classes |
|---|---|---|---|
| `--primary` | `142 76% 36%` (emerald-600) | same | `bg-primary`, `text-primary`, `border-primary` |
| `--secondary` | `210 20% 98%` (slate-50) | `217.2 32.6% 17.5%` (slate-800) | `bg-secondary`, `text-secondary` |
| `--accent` | `142 76% 36%` (emerald-600) | same | `bg-accent`, `text-accent` |
| `--highlight` | `45 100% 51%` (amber-500) | same | `bg-highlight`, `text-highlight` |
| `--success` | `142 76% 36%` (emerald-600) | — | `bg-success`, `text-success` |
| `--warning` | `45 100% 51%` (amber-500) | — | `bg-warning`, `text-warning` |
| `--error` / `--destructive` | `0 100% 50%` (red-500) | — | `bg-error`/`bg-destructive`, etc. |
| `--info` | `221 83% 53%` (blue-500) | — | `bg-info`, `text-info` |
| `--background` / `--foreground` | white / `222.2 47.4% 11.2%` (near-black) | `222 47% 3.5%` (stone-950) / `213 31% 91%` (slate-100) | `bg-background`, `text-foreground` |
| `--muted`, `--card`, `--popover`, `--border`, `--input`, `--ring` | standard shadcn-style neutrals | dark equivalents | `bg-muted`, `bg-card`, etc. |

Each color also has a paired `-foreground` token (e.g. `--primary-foreground`) for text/icon color that stays readable on top of it — use `text-primary-foreground` on anything sitting on a `bg-primary` background rather than guessing at a contrasting color.

## Light / dark / system mode

`frontend/src/shared/contexts/theme-provider.tsx` exposes a `useTheme()` hook (`{ theme, setTheme }`, values `'light' | 'dark' | 'system'`), backed by a `.dark` class toggle on `<html>` (see `darkMode: 'class'` in `tailwind.config.js`) and persisted to `localStorage`. There is no per-Orisha theme switcher — light/dark/system is the entire theme-switching surface today.

## Using the tokens in components

```tsx
// Use semantic tokens, never hardcoded hex/HSL values
<div className="bg-primary text-primary-foreground">Primary background</div>
<button className="bg-secondary hover:bg-secondary/90">Secondary button</button>
<span className="text-destructive">Error text</span>
```

`frontend/.eslintrc.cjs` has a `no-restricted-syntax` lint rule (set to `'error'`) specifically to catch literal Tailwind color classes (e.g. `bg-emerald-600` instead of `bg-primary`) — if you're adding a new color, add a token in `index.css`/`tailwind.config.js` first rather than reaching for a raw palette class.

## Maintenance

- Add or change a color: edit the CSS custom property in `frontend/src/index.css` (both the `:root` light block and the `.dark` block if it should differ), then expose it as a Tailwind color in `frontend/tailwind.config.js` if it isn't already.
- There is no code-generation step — the CSS variables are the source of truth, read directly by Tailwind's `hsl(var(--x) / <alpha-value>)` pattern.
