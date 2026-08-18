# DailyFlora Daily Publish Automation Runbook

Last updated: 2026-08-19

This runbook is the stable checklist for the `dailyflora` cron automation. Keep
the automation prompt short and point it here instead of duplicating this file.

## Scope

Run the DailyFlora daily date-seeded build from:

```text
/Users/ziqing/Documents/dailyFlora
```

or from an explicitly registered DailyFlora worktree when a release branch is
being tested.

The primary public static release surface is GitHub Pages. Vercel production is
a separate Git-integration production surface that must be verified, but the
project should not be described as mainly dependent on Vercel. `main` is a
source snapshot health check; `gh-pages` is the GitHub Pages artifact branch.

Do not browse Xiaohongshu or gather external aesthetic references during the
daily run. If there is no owner-provided new input, use the existing 0.13
aesthetic system and the Asia/Shanghai date seed.

## Startup Gates

1. Check context/token budget first. If an exact token percentage is unavailable
   but this is a fresh cron run, continue. If the task is clearly below 95%
   remaining context, do not modify files or push; report `skipped`.
2. Verify the DailyFlora checkout before any mutation:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status --short
```

The root must be `/Users/ziqing/Documents/dailyFlora` or an explicitly named
DailyFlora worktree. Never mutate PANYAN or another project from this task.

3. Read these project gates before acting:

```text
.codex/skills/dailyflora/SKILL.md
docs/dailyflora-codex-skill.md
docs/dailyflora-aesthetic-system-0.13.md
docs/codex-aesthetic-handoff.md
CHANGELOG.md
```

Use concise reads and targeted searches. Do not paste full long documents into
the conversation unless debugging requires exact evidence.

## Aesthetic Gates

- New generated bouquets that need fixed display must have their own
  `theme`, `flowerPlan`, and URL. Do not borrow another bouquet address.
- Ordinary daily date-seed updates must keep the default DailyFlora date
  generation mechanism and avoid meaningless version or random-file churn.
- If owner-provided new flower or visual work exists only on another branch,
  report the branch boundary. Do not merge or release it unless the task
  explicitly asks for that release.
- If unrelated dirty changes exist, do not roll them back. If they block a
  build or release, stop and report the conflict.

## Build

Run builds serially because both mutate `dist`:

```bash
npm run build >/tmp/dailyflora-build.log 2>&1
npm run build:vercel >/tmp/dailyflora-build-vercel.log 2>&1
```

On success, summarize only the result and known warnings. On failure, report the
failing command and the relevant tail of the log.

## GitHub Publish

Run:

```bash
npm run deploy:github >/tmp/dailyflora-deploy-github.log 2>&1
```

This publishes:

- `main`: source snapshot from `scripts/deploy-source-files.json`
- `gh-pages`: static GitHub Pages artifact

Record the final JSON fields: `main.commit`, `pages.commit`, and `pagesUrl`.
Wait for GitHub Pages status to be `built`.

If `deploy:github` is quiet during GitHub blob uploads, inspect process/refs
before interrupting. A changing `gh api .../git/blobs` child process usually
means progress.

## GitHub Pages Verification

Verify these URLs with HTTP status and `/version.json` body:

```text
https://calfnai.github.io/dailyFlora/
https://calfnai.github.io/dailyFlora/docs/aesthetic-review-dashboard.html
https://calfnai.github.io/dailyFlora/docs/dailyflora-reference-gallery.html
https://calfnai.github.io/dailyFlora/docs/primitive-lab.html
https://calfnai.github.io/dailyFlora/docs/dailyflora-flower-plan-samples.html
https://calfnai.github.io/dailyFlora/version.json
```

`/dashboard/` is not the canonical dashboard route unless the code later adds
that route. The canonical dashboard is the docs HTML route above.

## Vercel Verification

Do not directly deploy production with Vercel CLI or connectors. Vercel
production must come from GitHub integration.

Project:

```text
teamId: team_BJqn5lA5b8a79oTFBl7MZo9m
projectId: prj_W7tPbmxctuhupH9puirg92KbvjVA
project: daily-flora
```

Production truth:

- `target=production`
- `githubCommitRef=codex/dailyflora-integration`
- `githubCommitSha` equals current integration HEAD or the task's pushed fix
  commit
- state is `READY`

If production is `ERROR`, read build logs and report the cause. If no new
integration commit was pushed in the run, an existing READY production
deployment for the current integration HEAD is acceptable.

Source snapshot health:

- A Vercel preview for the run's `main` commit should be `READY`.
- If normal curl is blocked by Vercel protection, use the Vercel connector's
  protected URL fetch for `/version.json`.
- Treat `main` as source snapshot health only, not production.

Ignore Vercel previews for `gh-pages`; GitHub Pages status and public URL checks
are the only gates for that branch.

## Output Discipline

The goal is to reduce token use across all noisy tools, not to single out
Vercel. Apply this to long project documents, build logs, GitHub API output,
Vercel deployment lists, curl bodies, and browser/debug output:

- Prefer targeted `rg`, `sed`, and summarized command output.
- Send full logs to `/tmp/dailyflora-*.log`.
- On success, report compact evidence.
- On failure, include the command, failing status, and only the relevant log
  tail or filtered error lines.

## Final Report

Keep the result concise and include:

- Asia/Shanghai date
- build status
- GitHub publish status and Pages status
- Vercel production status
- main source snapshot health
- GitHub Pages URL
- Vercel production URL
- main commit
- gh-pages commit
- integration commit
- Vercel deployment ID
- skipped or failed reason, if any

Before finishing, append a concise run note to:

```text
/Users/ziqing/.codex/automations/dailyflora/memory.md
```
