# DailyFlora collaboration contract

## Repository boundary

- DailyFlora code belongs in `/Users/ziqing/Documents/dailyFlora` or in an
  explicitly named worktree registered to this repository, such as
  `/Users/ziqing/.codex/worktrees/*/dailyFlora`.
- Before any mutation, verify `pwd`, `git rev-parse --show-toplevel`, and
  `git branch --show-current`; the resolved root must be DailyFlora.
- Never edit, build, commit, deploy, or create worktrees under PANYAN from a
  DailyFlora task. PANYAN is a separate project family.
- If the cwd is a parent container or the Git root is not DailyFlora, keep the
  task read-only until the exact DailyFlora root is selected.

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

## Local 0.72 worker bridge

- `127.0.0.1:43172` is a local-only worker bridge for the internal admin queue,
  not a website and not a user-facing preview URL. It is reachable only on the
  same Mac where the worker process is running.
- Before giving any `127.0.0.1:<port>/...` address, verify that the process is
  listening, make the exact HTTP request, and confirm the returned status/body
  or browser page. A guessed or unverified local URL must never be presented as
  available. If verification fails, report that it is unavailable and give the
  exact command or next action needed.
- For this worker, both the verified root status URL
  `http://127.0.0.1:43172/` and the explicit health URL
  `http://127.0.0.1:43172/health` are browser-readable JSON status checks. The
  root response must be verified after startup before handing it to the user.
- If port `43172` is not listening and the task needs the worker, start it from
  the exact DailyFlora worktree with `npm run worker:beta`, then verify the URL
  again before handing it to the user. Queue processing uses `POST /process`
  from the admin page; it is not a link for manual browsing.
- Always state that this loopback bridge is local HTTP by design and is separate
  from the public HTTPS GitHub Pages site and HTTPS UniCloud API. Do not use it
  as evidence that production HTTPS is configured.
