# Publishify

The Publishify writing editor: one Cloudflare Worker (`app/api`) that serves the React client (`app/client`) at `write.publishify.app` (production) and `staging.publishify.app` (staging). It moved here from `publishify/platform` on 2026-11-18; the server-side Board was left behind and abandoned. The editorial board is now a separate plugin that runs in the writer's own AI (`publishify/plugin`); this editor never sends a manuscript to a model.

## Commands
- Install: `pnpm install`
- Everything (lint, types, tests, language rule, build): `pnpm check`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Types: `pnpm typecheck`
- Local client: `pnpm dev`

## Conventions
- TypeScript (strict), pnpm workspace, Hono, Vitest, Wrangler, React and Vite.
- **No Turkish in code.** Folder and file names, identifiers, tables, API paths, error codes, comments, test names and commit messages are English. Author-facing text lives only in translation files under `app/client/src/i18n/` and is reached by key. Markdown documents may be Turkish. `pnpm check:language` enforces this.
- Never log manuscript text. Logs carry `requestId` and the opaque `tenant`, not the user.
- Old database tables for reviews (`review_jobs`, `note_actions`) stay in the migrations so existing databases keep their history; no code writes to them.

## Architecture
- `app/api`: Hono API Worker (accounts, passkeys, Google sign-in, sync, publishing) and the per-book Durable Object `BookDO`. D1 holds accounts and records, R2 holds snapshots.
- `app/client`: the writing editor (parts, chapters, scenes, live Markdown, export).
- `packages/contracts`: shared types.
- `scripts/`: the language check and data-integrity tests.

## How work moves
- Small, short-lived branches off `main` (`feat/...`, `fix/...`), one pull request each. Every change comes with its tests. CI runs `pnpm check`.
- Try changes on staging before production.

## Verifying your work
Run `pnpm check` before reporting any task complete. If a test fails, fix the code, not the test.

## Asking first
Deploying to Cloudflare, creating paid resources, anything touching real users or a publishify.app address: ask the founder first. Explain outcomes to the founder in plain Turkish.

## Things Claude gets wrong
- Writing a Turkish character directly in a source file. In code that must mention one (the language check itself), use a unicode escape.
