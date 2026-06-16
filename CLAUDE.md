# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Anime Manager — a local anime library manager. Scan local folders, browse a poster-wall UI, track watch progress, and manage tags. Built as a monorepo with Express backend + React (Vite) frontend, using a single `db.json` file as the database.

## Commands

```bash
npm run install:all    # install deps for root, server, and client
npm run dev            # start both server (:3001) and client (:5173) with hot reload
npm run dev:server     # server only (node --watch)
npm run dev:client     # client only (vite)
```

The client Vite dev server proxies `/api` → `http://localhost:3001`.

## Architecture

### Data model (db.json)

```json
{
  "anime_path": "P:\\Anime",
  "animes": [
    {
      "id": "uuid",
      "name": "folder name",
      "path": "absolute path",
      "cover": "path/to/cover.jpg | null",
      "tags": ["tag1"],
      "episodes": [
        { "filename": "...", "path": "absolute path", "progress": 0, "watched": false }
      ]
    }
  ]
}
```

### Server (`server/`, ESM, port 3001)

- `index.js` — entry point. Creates Express app, mounts routes as factory functions passing `dbPath`, and serves cover images via `/api/cover?path=...`
- `routes/settings.js` — `GET/POST /api/settings` for `anime_path`
- `routes/scanner.js` — `POST /api/scan`. Calls `services/scanner.js` to walk the filesystem, merges new results with existing data (preserving user state: tags, watched, progress, custom cover)
- `routes/anime.js` — `GET /api/animes`, `GET /api/animes/:id`, `PATCH /api/animes/:id` (update tags and episode watched/progress by filename match)
- `services/scanner.js` — walks 2 levels deep: top-level dirs = anime titles; videos directly in them or one subfolder deeper. Recognizes `.mp4/.mkv/.avi`, detects cover images named `cover/poster/folder/front.*`

**Key pattern**: All route files export a factory function `(dbPath) => Router`. Each route reads/writes `db.json` synchronously on every request — there is no caching layer.

### Client (`client/src/`, React 18 + Tailwind CSS 3)

- `App.jsx` — top-level state machine: loading spinner → SetupWizard (if no path set) → AnimeDetail (if an anime is selected) → AnimeGrid (default). Manages `animePath`, `animes[]`, `selected`, `loading`, `scanning`, `error`.
- `api.js` — thin fetch wrapper for all `/api/*` endpoints. Note: `getAnimes()` does not check `res.ok` (unlike other functions), it just returns `res.json()`.
- Components: `SetupWizard` (path input + scan trigger), `AnimeGrid` (search bar + responsive poster grid), `AnimeCard` (cover image with gradient placeholder + progress bar + tags), `AnimeDetail` (full detail with episode checklist + tag editor)

### Frontend state flow

1. On mount, `GET /api/settings` → if `anime_path` exists, `GET /api/animes`
2. User sets path → `POST /api/settings` → `POST /api/scan` → updates `animes[]`
3. Click card → sets `selected` → renders `AnimeDetail`
4. Toggle watched / edit tags → `PATCH /api/animes/:id` → optimistic UI update via `onUpdate` callback

### Git branches

| Branch | Purpose |
|---|---|
| `main` | Core scaffold — scanning, CRUD, poster wall (current branch) |
| `feat/web-stream` | Adds Bangumi scraping, web video player with HTTP Range streaming, pkg single-exe packaging |
| `feat/local-player` | Adds offline mode, external player launcher, Electron shell |

## Notes

- No tests, no linter, no `.gitignore` (generated build artifacts and `node_modules` are in the working tree)
- `db.json` contains real user data and is committed — do not add it to `.gitignore` unless the user asks
- The server uses synchronous filesystem I/O throughout — fine for a single-user local app
- Paths are Windows-style with backslashes (e.g., `P:\Anime`)
