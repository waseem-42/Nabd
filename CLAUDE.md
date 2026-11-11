# Nabd — Claude Code instructions

Nabd (نبض) is a Vite + React + TypeScript PWA (npm). Two people work on it from
different machines, each with their own Claude Code. Collaboration guide (Arabic):
`docs/COLLABORATION.md`.

## Commands
- `npm run dev` — dev server (port 5173)
- `npm run build` — typecheck + production build (must pass before any PR)
- `npm test` — vitest

## Git workflow (required)
- Never commit directly to `main`. Start every change with `git switch main && git pull`,
  then `git switch -c feat/<short-name>` (or `fix/…`, `docs/…`).
- Keep commits small; run `npm run build` (and `npm test`) before pushing.
- Push the branch and open a Pull Request into `main` (`gh pr create --base main`).
- Never merge a PR or enable auto-merge unless the user explicitly asks.
- Never `git push --force`, `git reset --hard`, or delete files/branches you didn't create
  without the user's approval.
- Never commit `.env` files, API keys, tokens or passwords.
- Before starting work, check `gh pr list` to avoid editing files another open PR touches;
  warn the user if overlap is likely.
- Don't edit `package-lock.json` by hand; use `npm install <pkg>`.
