# 🍷 Vinkveld

Planlegg vinkveldens lineup — a web app for planning wine tasting evenings.

Create a wine night, share the link, and let everyone add the wines they're bringing. Search from millions of wines with autocomplete powered by Vivino's database.

## Features

- **Create wine nights** with a title and date, shareable via URL
- **Wine search** with autocomplete, ratings, and vintage suggestions
- **Real-time collaboration** — changes sync instantly for all participants
- **Mobile-friendly** responsive design

## Tech stack

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Tailwind CSS 4](https://tailwindcss.com/)
- Deployed to [GitHub Pages](https://pages.github.com/) as a static SPA

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js)
- A Firebase project with Realtime Database enabled

### Setup

1. Clone the repo and install dependencies:

   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env` and fill in your Firebase config:

   ```bash
   cp .env.example .env
   ```

3. Start the dev server:

   ```bash
   bun run dev
   ```

### Available scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run check` | Run type checking |
