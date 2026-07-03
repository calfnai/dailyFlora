# DailyFlora

DailyFlora is a daily digital bouquet project. The current public surface is a
frontend 3D bouquet screensaver: it generates a new spatial bouquet every day
from a deterministic date seed, then slowly rotates it so the bouquet reads from
every angle.

Current product version: `0.14`.

`0.14` keeps the `0.13` aesthetic operating-system memory and adds the first
MVP route structure: public placeholders, an internal development index,
mock member/admin surfaces, and a lighter fixed-bouquet sample library. The
current dashboard groups are accepted as a baseline; future changes should come
from concrete feedback on the running pages. Read `docs/project-abstract.md`,
`docs/dailyflora-aesthetic-system-0.13.md`, `docs/dailyflora-codex-skill.md`,
and `CHANGELOG.md` together.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build output is static and can be hosted on GitHub Pages.

## Aesthetic Review Gate

Before changing the main bouquet visuals, review
`docs/aesthetic-review-dashboard.html`. It maps reference groups to visual
signals, primitive requirements, role reviews, current status, and next tasks.

For the 0.13 aesthetic memory and Codex workflow, read:

- `docs/dailyflora-aesthetic-system-0.13.md`
- `docs/dailyflora-codex-skill.md`
- `.codex/skills/dailyflora/SKILL.md`

## Deploy To GitHub Pages

First-time login on a machine:

```bash
npm run github:login
```

Deploy the source manifest to `main` and the built static site to `gh-pages`:

```bash
npm run deploy:github
```

Deploy only the built static site:

```bash
npm run deploy:pages
```

The deploy script uses GitHub CLI authentication and automatically downloads a
local GitHub CLI copy into `.tools/gh` if `gh` is not installed. The default
source sync is intentionally manifest-based via
`scripts/deploy-source-files.json`, so unrelated local drafts are not pushed by
accident. Use `node scripts/deploy-github-pages.mjs --main=tracked` only when
you intentionally want to sync all tracked files except ignored build/inbox
paths and workflow files.

If a new Codex conversation says the project cannot sync to GitHub, read
`docs/github-sync-runbook.md`. The usual cause is missing system-level `gh`
installation or missing GitHub authentication, not a repository limitation.

## Multi-device Workflow

This repository is safe to use as the shared source for multiple development
machines.

```bash
git clone https://github.com/calfnai/dailyFlora.git
cd dailyFlora
npm ci
npm run dev
```

Before switching machines, commit and push the current branch. On the next
machine, pull the branch before editing. Keep generated folders such as
`node_modules/`, `dist/`, and dated `data/inbox/` folders out of Git.

TouchDesigner `.toe`, `.tox`, and `.tdz` files are treated as binary project
assets. If those files become large, move them to Git LFS before using GitHub as
the long-term sync point.

## URL Options

- `?date=YYYY-MM-DD` previews a specific day.
- `?seed=...` shares a fixed bouquet.
- `?theme=random` lets the date or seed choose the bouquet family.
- `?theme=dopamine-field|summer-pinwheel|fairy-violet|moon-white|tropical-forest|sea-salt-lemon|hillside-wild|starry-night|dewberry-morning|lychee-garden-rainbow` previews a specific bouquet family.
- `?density=low|medium|high` controls bouquet density.
- `?render=auto|low|medium|high` controls rendering precision.
- `?debug` or `?debug=1` shows debug-only controls, the aesthetic review entry, and rendering/resource stats.

## Inspiration Workflow

The app does not log in to Xiaohongshu or publish reference images. Reference
updates live in `data/inspiration-library.json` and must be confirmed before
they influence the generator.

```bash
npm run inspiration:links -- data/inbox/YYYY-MM-DD/owner-links.json
npm run inspiration:ingest -- data/inbox/YYYY-MM-DD/notes.json
```

The first command reads owner-provided Xiaohongshu links and writes compact
`notes.json` observations. If a link cannot be read, it records `accessIssues`
so the read path can be fixed without asking the owner for manual descriptions.
Lobster is only a fallback for a single explicit link, not the default workflow.

The default mobile profile is intentionally conservative. Auto quality treats
phones as `low`, aiming for a screensaver that stays closer to an iPhone 13 Pro
20-30% rendering budget than a benchmark demo.
