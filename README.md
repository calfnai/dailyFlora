# DailyFlora

DailyFlora is a pure frontend 3D particle bouquet screensaver. It generates a
new spatial bouquet every day from a deterministic date seed, then slowly
rotates it so the bouquet reads from every angle.

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

## URL Options

- `?date=YYYY-MM-DD` previews a specific day.
- `?seed=...` shares a fixed bouquet.
- `?quality=auto|low|medium|high` controls rendering load.

## Reference Deck

- `docs/reference-deck.md` is the repo-visible named summary of the current reference set.
- The richer gallery is maintained locally in the workspace for direct image review.

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
