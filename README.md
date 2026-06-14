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

## Inspiration Workflow

The app does not log in to Xiaohongshu or publish reference images. Reference
updates live in `data/inspiration-library.json` and must be confirmed before
they influence the generator.

```bash
npm run lobster:plan
npm run inspiration:ingest -- data/inbox/YYYY-MM-DD/notes.json
```

The first command creates a compact handoff packet for Lobster, the external AI
app you can use with DeepSeek. DailyFlora only ingests Lobster's resulting JSON.

The default mobile profile is intentionally conservative. Auto quality treats
phones as `low`, aiming for a screensaver that stays closer to an iPhone 13 Pro
20-30% rendering budget than a benchmark demo.
