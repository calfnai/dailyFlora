# DailyFlora Inspiration Workflow

The screensaver remains a static GitHub Pages app. Inspiration checking is a
separate workflow that reviews the creator list in `data/inspiration-library.json`.

## Nightly Check

- Time: 21:00 Asia/Shanghai.
- Access: Lobster uses the owner's local Xiaohongshu login state when available.
- Fallback: if the page is blocked or logged out, report the access issue and
  wait for the owner to provide screenshots or fresh links.
- Token budget: Codex should read compact Lobster output from `data/inbox`
  instead of browsing Xiaohongshu directly during normal checks.

## Lobster Handoff

1. Run `npm run lobster:plan`.
2. Open Lobster and give it `data/inbox/YYYY-MM-DD/lobster-task.json` or
   `data/inbox/YYYY-MM-DD/lobster-prompt.md`.
3. Ask Lobster, using its DeepSeek engine, to write
   `data/inbox/YYYY-MM-DD/notes.json`.
4. Run `npm run inspiration:ingest -- data/inbox/YYYY-MM-DD/notes.json`.
5. Review `pendingRecommendations` in `data/inspiration-library.json`.

## What To Record

- Creator, title, source link, and observation date.
- Color palette observations.
- Spatial structure: branch direction, bouquet volume, density, front/back cues.
- Material rhythm: small flowers, grasses, berries, mist, glow points.
- Parameter suggestions that can be translated into DailyFlora generation rules.

## What Not To Do

- Do not copy reference images into the deployed app.
- Do not let new references automatically change the generator.
- Do not fabricate updates when Xiaohongshu access fails.
