# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A free, no-server site that tracks trending agentic AI / GenAI / LLM content. A Node/TypeScript
backend (`backend/`) fetches from free public APIs and RSS feeds on a schedule and commits dated
YAML snapshots into `data/`. An Angular 18 static frontend (`frontend/`) fetches that YAML
client-side at runtime and renders it. No database, no custom API server, no required API keys.

`backend/` and `frontend/` are two independent npm projects (separate `package.json` /
`node_modules`, no workspace) — always `cd` into the one you're working on before running npm
commands.

## Commands

### Backend (`backend/`)

```
npm install                       # install deps
npm test                          # run all Jest regression tests
npx jest test/github.test.ts      # run a single test file
npx jest -t "normalizeGithubRepo" # run tests matching a name
npx tsc --noEmit                  # typecheck only
npm run fetch:all                 # run the real fetch pipeline, writes into ../data
```

`fetch:all` hits live network APIs (GitHub, Hugging Face, arXiv, Hacker News, the RSS feeds) and
writes real files under `data/`. Don't run it just to iterate on fetcher logic — write/extend a
Jest test with injected fixtures instead (see Architecture below).

### Frontend (`frontend/`)

```
npm install
npm start                # ng serve, dev server — see note below before running this
npm run build            # plain dev build
npm run build:pages      # production build with the GitHub Pages base-href + data/ copy (what CI runs)
```

`ng serve` will not show real data by itself: the dev server only serves `frontend/public/`, not
the repo-root `data/` directory. Copy `data/` into `frontend/public/data/` first if you need the
dev server to render real content.

There is no frontend test suite currently.

## Architecture

### Data flow

```
backend/src/fetchers/*.ts  →  enrichTags()  →  data/<date>/<source>.yaml
                                            →  data/<date>/all.yaml   (merged, deduped)
                                            →  data/latest.yaml       (copy of today's all.yaml)
                                            →  data/index.yaml        (list of available dates)

frontend DataService  →  fetch()'s data/latest.yaml (or data/<date>/all.yaml) at runtime  →  js-yaml.load()
```

`data/` is committed straight into the repo (not gitignored) and is the only thing connecting the
two halves of the project — there is no API between frontend and backend. `backend/src/runAll.ts`
is the orchestrator: it runs each source job, tags the results, and writes the files above. A
failing source is caught and logged per-job so one broken fetcher doesn't block the others or
fail the whole run.

### Fetcher pattern (`backend/src/fetchers/*.ts`)

Every fetcher follows the same two-function shape, which is what makes them unit-testable without
hitting the network:

- `normalize<Source>(raw)` — pure function, maps that API's response shape into the shared
  `ContentItem` (defined in `backend/src/types.ts`). Tested directly against fixture JSON in
  `backend/test/fixtures/`.
- `fetch<Source>Trending(client = <default client>)` — takes an injectable HTTP client or parser
  (default is the real one) so tests can pass a mock and assert the full fetch→normalize path
  without network access.

`arxiv.ts` and `rss.ts` both use `rss-parser` (arXiv's API is Atom under the hood) and share the
`ArxivParser`/`ArxivFeedItem` types from `arxiv.ts`. When adding a 6th source, follow this same
shape and wire it into the `JOBS` array in `runAll.ts`.

### Tagging (`backend/src/tags.ts`)

`enrichTags()` runs over every fetched item (in `runAll.ts`, before writing) and keyword-matches
title/summary/details/existing tags against a fixed set of "pinned" topic tags: `agentic-ai`,
`azure`, `dotnet`, `angular`, `langgraph`, `llm`, `genai`. Patterns are word-boundary regexes to
avoid look-alikes (e.g. "triangular" must not match `angular`). This list is duplicated in
`frontend/src/app/feed/feed.component.ts` (`PINNED_TAGS`) so the UI always shows those 7 chips
first regardless of whether any current item has them — **keep the two lists in sync if you
change one.**

### Merging (`backend/src/merge.ts`)

`mergeAndDedup()` dedupes across all sources by `url` (falling back to `id`) and sorts by
`publishedAt` descending. This is what produces `all.yaml` / `latest.yaml` from the per-source
arrays.

### Frontend (`frontend/src/app/`)

Angular 18, standalone components (no NgModules), two routes only:
`app.routes.ts` → `/` (`FeedComponent`) and `/item/:id` (`ItemDetailComponent`).

`DataService` (`services/data.service.ts`) fetches YAML files as text via `HttpClient` and parses
them with `js-yaml` in the browser — there is no backend API call. It caches one promise per path
so repeat navigations don't re-fetch. `FeedComponent` filters client-side by source tab and tag
(both as Angular signals/computed), with the pinned tags described above always listed first.

### GitHub Pages build specifics

`frontend/scripts/copy-data.js` is a required post-build step (wired into `npm run build:pages`):
it copies the repo-root `data/` into the build output, and duplicates `index.html` as `404.html`
so client-side routing works on GitHub Pages (which has no server-side SPA rewrite). The Pages
base-href (`/Project_tech_research/`) is hardcoded into the `build:pages` npm script — if the repo
is ever renamed, that script needs updating.

### CI (`.github/workflows/`)

- `fetch.yml` — cron every 6h (+ manual dispatch). Installs backend deps, runs `npm test`, runs
  `npm run fetch:all`, then commits any changed `data/` files as `github-actions[bot]` and pushes.
- `pages.yml` — builds the frontend (`npm run build:pages`) and deploys via
  `actions/deploy-pages`. Triggers on push to `frontend/**`/`data/**`, and *also* on
  `workflow_run` completion of `fetch.yml`. The `workflow_run` trigger is required, not
  redundant: a push made with the default `GITHUB_TOKEN` (as `fetch.yml`'s commit step does)
  does not cascade to trigger other workflows' `push:` events — without `workflow_run`, the site
  would silently never pick up new data.
- The frontend's CI install step intentionally uses `npm install`, not `npm ci` — `npm ci` was
  found to reject `frontend/package-lock.json` over a `chokidar` 3-vs-4 resolution conflict that
  reproduces even against a freshly regenerated lockfile (an npm-side inconsistency in the
  Angular CLI dependency tree, not a stale-lockfile issue). Don't "fix" this back to `npm ci`
  without re-verifying that quirk is gone.

### Hosting constraints

The Angular app is built by GitHub Actions (`pages.yml`), which runs `npm run build:pages` in `frontend/`
and uploads the output. The repo has no Netlify config. If the live site is also hosted on Netlify, its
own build settings control any Netlify-side build; this file does not cover that.
GitHub Pages URL: https://saravmani-kmu.github.io/Project_tech_research/

The repo's default branch is `claude/ai-trends-website-content-m7c198` (there is no `main`). Scheduled
workflows only run on the default branch, so `fetch.yml` commits its data refreshes there, and
`pages.yml` deploys from it.

No API keys are required for any of the 5 sources (GitHub, Hugging Face, arXiv, Hacker News,
RSS). `fetch.yml` optionally passes `GITHUB_TOKEN` to raise GitHub's unauthenticated rate limit;
it's auto-available in Actions. GitHub Pages requires the repo to be public (or a paid plan) to
publish — it's currently public for this reason.
