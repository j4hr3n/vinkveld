# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vinkveld is a SvelteKit SPA for planning wine tasting evenings. Users create a wine night, share the URL, and collaborators add wines with details. Data is stored in Firebase Realtime Database. Deployed as a static site to GitHub Pages.

## Commands

```bash
bun run dev       # Dev server at localhost:5173
bun run build     # Static build to ./build
bun run preview   # Preview production build
bun run check     # svelte-check type checking
```

No test framework is configured.

## Architecture

- **SvelteKit 2 + Svelte 5** with runes (`$state`, `$derived`, `$effect`) — no external state library
- **Static adapter** targeting GitHub Pages at base path `/vinkveld`, with `404.html` fallback for SPA routing
- **SSR disabled** (`ssr: false`, `prerender: false` in `+layout.ts`)
- **Firebase Realtime Database** for persistence — real-time subscriptions via `onValue`
- **Algolia (Vivino index)** for wine search autocomplete in `vivinoSearch.ts`
- **Tailwind CSS 4** with custom theme (wine/cream/gold palette, custom animations)

### Key files

| File | Role |
|------|------|
| `src/lib/firebase.ts` | Firebase config, night/wine CRUD |
| `src/lib/vivinoSearch.ts` | Wine search via Algolia API |
| `src/lib/components/WineSearchModal.svelte` | Modal with keyboard-navigable search results |
| `src/lib/components/WineForm.svelte` | Add/edit wine form |
| `src/lib/components/WineCard.svelte` | Wine display card |
| `src/routes/+page.svelte` | Home — create new wine night |
| `src/routes/[nightId]/+page.svelte` | Night detail — manage wines |
| `src/lib/identity.ts` | User name persistence via localStorage |

### Firebase data model

```
nights/<nightId>/title, date, created
nights/<nightId>/wines/<wineId>/name, color, person, notes, link, added
```

Wine colors: `"red" | "white" | "rosé" | "bubbles"`

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to main. Firebase config is injected via GitHub Secrets environment variables.
