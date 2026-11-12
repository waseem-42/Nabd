# Nabd — Codex instructions

Nabd (نبض) is a Vite + React + TypeScript PWA (npm), open source under AGPL-3.0. Two people
work on it from different machines, each with their own Codex. Collaboration guide
(Arabic): `docs/COLLABORATION.md`.

Roadmap (Arabic): `docs/ROADMAP.md` — check the current phase before starting new work, and
tick the task off in the same commit.

## Commands
- `npm run dev` — dev server (port 5173)
- `npm run build` — typecheck + production build (must pass before pushing)
- `npm test` — vitest

## Auto-sync hooks (.codex/hooks.json)
- SessionStart (`.codex/hooks/sync-start.sh`) fetches and rebases `main` on `origin/main`
  (autostash; aborts on conflict). Summarize its output to the user briefly in your first reply.
- Stop (`.codex/hooks/auto-push.sh`) auto-commits all changes, rebases them on the latest
  `origin/main`, and pushes to `main`. So you don't need to commit/push manually.
- If a hook reports a conflict or failed push, help the user resolve it without losing work
  (theirs or the other person's), then push to `main`.
- If the checkout is on an old feature branch, help the user bring that work onto `main`.

## Git workflow (required)
- Work directly on `main`. No feature branches and no Pull Requests unless the user asks.
- Run `npm run build` and `npm test` before a change is considered done; a red `main`
  breaks the other person too.
- Never `git push --force`, `git reset --hard`, or delete files/branches you didn't create
  without the user's approval.
- Never commit `.env` files, API keys, tokens or passwords — the repository is public.
- Don't edit `package-lock.json` by hand; use `npm install <pkg>`.
