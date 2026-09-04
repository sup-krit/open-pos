# Open POS — Frontend

Frontend scaffold for Open POS, a single-brand retail POS / back-office
system (portfolio build — not a real client project). Built with Next.js
(App Router), TypeScript, and Tailwind CSS.

This is a **scaffold**: skeleton pages with static placeholder/sample data
and no live API wiring yet. That comes later, once the FastAPI backend is
connected.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to `/dashboard`.

## Environment variables

This app reads its configuration (Supabase URL/keys, API base URL) from
environment variables. See the repo-root `.env.example` for the full list —
that file is owned by another part of this project and is not duplicated
here. Copy it to `frontend/.env.local` (or the repo root, per its own
instructions) before wiring up real data.

## Structure

- `app/(back-office)/` — desktop back-office shell (sidebar + topbar):
  Dashboard, Orders (+ order detail), Inventory, Customers, Promotions,
  Accounting.
- `app/pos/` — mobile-first POS/Sell shell, no sidebar.
- `app/checkout/[token]/` — public, no-shell customer checkout
  (address entry) page opened from a shared link.
- `components/shell/` — `Sidebar`, `Topbar`, and nav icons shared by the
  back-office layout.
- `components/ui/` — small reusable primitives (`Card`, `Button`, `Badge`,
  `Table`, filter pill) used across pages instead of duplicating markup.

## Design tokens

Colors and fonts (Warm Editorial palette — Newsreader for display/page
titles, Work Sans for everything else) are defined once in
`tailwind.config.ts` and consumed via Tailwind utility classes (`bg-paper`,
`text-ink`, `border-border`, `bg-accent`, `font-display`, etc.) rather than
hardcoded hex values in components. Fonts are loaded via `next/font/google`
in `app/fonts.ts`.

## Notes

- All data on these pages is static sample data for layout/demo purposes.
- No legacy brand names are used anywhere in this codebase.
