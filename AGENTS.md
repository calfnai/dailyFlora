# DailyFlora collaboration contract

## Concurrent tasks

- Every Codex task works in its own `codex/<topic>` branch and its own Git worktree.
- Do not edit, reset, stash, or clean another task's worktree.
- The only integration branch is `codex/dailyflora-integration`.
- Production deployment is allowed only from the integration branch.
- Production deployment must be triggered by pushing the integration branch to GitHub. Do not use a direct CLI production deploy, because it may omit Git metadata.
- Feature tasks open PRs against `codex/dailyflora-integration`; the integration task merges them one at a time after checks pass.

## Exact version identity

- Never identify a version as “previous”, “last”, “上一版”, or “上上版”.
- Every handoff must report: full Git SHA, branch, worktree path, build result, and Vercel Preview or Deployment ID when applicable.
- Every integration commit subject must begin with `[DF-YYYYMMDD-HHmm]`, using Asia/Shanghai time.
- The canonical release label is `DF-YYYYMMDD-HHmm-<8-char-sha>`.
- Before any rollback, resolve and repeat the exact Git SHA or Vercel Deployment ID. Do not roll back from relative natural-language descriptions.

## Build and deployment

- Run `npm run build:vercel` for Vercel-compatible output.
- Use Vercel CLI for inspection and diagnostics, not as the canonical production release trigger.
- `npm run build` is the OpenAI Sites packaging path and moves the client into `dist/client`; do not use that output for Vercel.
- The deployed page exposes `/version.json` and displays the release label in the lower-right corner.
