# DailyFlora Inspiration Workflow

The screensaver remains a static GitHub Pages app. Inspiration checking is a
separate workflow that reviews the creator list in `data/inspiration-library.json`.

## Nightly Check

- Time: 21:00 Asia/Shanghai.
- Access: owner-provided links only. Do not let Lobster batch-open Xiaohongshu
  pages or crawl creator homepages.
- Fallback: if Xiaohongshu asks for login, captcha, SMS, QR scan, or account
  verification, stop browsing and record the access issue.
- Token budget: Codex should read compact Lobster output from `data/inbox`
  instead of browsing Xiaohongshu directly during normal checks.

## Owner Link Handoff

1. Put owner-selected Xiaohongshu links in
   `data/inbox/YYYY-MM-DD/owner-links.json`.
2. Run `npm run inspiration:links -- data/inbox/YYYY-MM-DD/owner-links.json`.
3. If the script writes access issues, fix the read path together instead of
   asking the owner for manual descriptions.
4. Run `npm run inspiration:ingest -- data/inbox/YYYY-MM-DD/notes.json`.
5. Review `pendingRecommendations` in `data/inspiration-library.json`.

## Lobster Fallback

Use Lobster only if explicitly requested for a single owner-provided link. It is
not the default browser or analysis layer.

## What To Record

- Creator, title, source link, and observation date.
- Color palette observations.
- Spatial structure: branch direction, bouquet volume, density, front/back cues.
- Material rhythm: small flowers, grasses, berries, mist, glow points.
- Parameter suggestions that can be translated into DailyFlora generation rules.

## What Not To Do

- Do not copy reference images into the deployed app.
- Do not batch-open creator pages, crawl homepages, or trigger repeated
  Xiaohongshu login prompts.
- Do not require the owner to update or upload images; links are enough.
- Do not let new references automatically change the generator.
- Do not fabricate updates when Xiaohongshu access fails.
