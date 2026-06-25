# DailyFlora Changelog

## 0.12.6 - 2026-06-25

Public flower-plan sample page publishing.

- GitHub Pages deployment now publishes `docs/dailyflora-flower-plan-samples.html`.
- The public sample page can be used outside the local dev server to review fixed high-detail bouquet examples.

## 0.12.5 - 2026-06-25

Public reference gallery publishing.

- GitHub Pages deployment now publishes `docs/dailyflora-reference-gallery.html`.
- The gallery image folders `docs/释义/` and `docs/untitled folder/` are copied into the public Pages build so the gallery works online.
- This intentionally makes the local reference gallery publicly accessible after deployment.

## 0.12.4 - 2026-06-25

Reference flower identification and clear-mode correction.

- Added `docs/reference-flower-identification.md`, a visual identification pass over the local reference gallery.
- Reframed the reference bouquets as named material roles: disk flowers, layered round flowers, spike flowers, sculptural open flowers, cluster flowers, berries, and airy filler.
- Changed `清` rendering from five-petal low-poly flowers to smooth spherical flower masses with 80% opacity.
- Kept `省` as low-poly spherical flower masses.
- Updated the `清` control tooltip to describe the new translucent sphere behavior.

## 0.12.3 - 2026-06-25

Flower-plan layer for readable high-detail generation.

- Added `src/flowerPlans.ts`, a pre-render flower plan catalog derived from the local reference gallery.
- Daily bouquet specs now include `flowerPlan`, so high-detail rendering knows which named flower forms it is trying to generate before building geometry.
- `精` rendering now reads `spec.flowerPlan.items` instead of using fixed anonymous model batches.
- The HUD now displays the current flower plan and its named flower types, making it easier to judge whether the generated bouquet matches the stated intent.
- Added `docs/dailyflora-flower-plan-samples.html` with several fixed high-detail bouquet samples for review.

## 0.12.2 - 2026-06-25

Interaction and render-level correction.

- Repositioned the native date picker on top of the calendar button before opening, so it no longer appears outside the reachable browser area.
- Date selection now blurs the hidden picker after applying the date, letting the picker close naturally after selection.
- Corrected the camera controls:
  - circular-arrow button reverses the current camera route only.
  - star/preset button randomizes a new camera route preset.
- Re-aligned render levels with the intended meaning:
  - `省`: low-poly spherical flower masses.
  - `清`: simple 5-petal low-poly flowers.
  - `精`: multiple recognizable flower-form prototypes, including rose/camellia/peony-like layered blooms, chamomile-like daisies, orchid-like asymmetry, spike flowers, hydrangea/pompon clusters, and bell-fruit forms.

## 0.12.1 - 2026-06-25

Corrective patch for the 0.12.0 visual regression.

- Reverted the incorrect flower-head and green-plant batching that broke the bouquet's overall silhouette.
- Restored the steadier bouquet body distribution from the previous low-poly flower version.
- Added visible hover/focus tips on the auto-hiding control UI so each button explains its function in plain language.
- Clarified the circular-arrow control as "随机镜头路线" instead of leaving it visually ambiguous as a reverse icon.

## 0.12E - 2026-06-25

Extended MVP definition layer.

- Added `productVersion: 0.12E` while keeping npm `version` at valid SemVer
  `0.12.0`.
- Added the project abstract and development intention document.
- Defined the rule that `E` versions are Extended versions with product/data
  capabilities beyond the pure visual frontend.
- Added a free MVP architecture for no-server development on GitHub Pages and
  similar free static hosting.
- Added TypeScript field contracts for users, entitlements, bouquet records,
  favorites, share records, legal consent, and personal aesthetic inputs.
- Kept the implementation lightweight: no rented server, no paid database, no
  full app/APK/screen-saver build in this version.

## 0.12.0 - 2026-06-25

Current dense revision.

- Calendar button now opens a date picker instead of silently returning to today.
- Hover/title text now exposes the bouquet Chinese and English names.
- Random button now jumps to a random 2026 date and its date-seeded bouquet page.
- Camera route button now randomizes route behavior instead of only flipping left/right.
- Render levels now mean shape detail:
  - `省`: low-cost small solids, acceptable as simplified flower masses.
  - `清`: soft low-poly small flowers, still intentionally approximate.
  - `精`: mixed flower forms with varied size, cup/star/disc-like silhouettes, and more varied orientations.
- Green material is no longer only one repeated leaf shape; it now includes leaf, grass, rounded, and split botanical forms.
- Flower instances no longer all face the same direction.

Main files deciding the visual result:

- `src/bouquetScene.ts`
- `src/main.ts`
- `index.html`
- `src/styles.css`

## 0.11.0 - 2026-06-24

Reference gallery and low-poly flower revision.

- Added the local reference gallery with owner-provided positive and negative examples.
- Added image-backed reference cards and grouped observations.
- Replaced the earlier ball-like flower points with low-poly petal-like flower heads.
- Added special bouquet assets and GitHub Pages deployment support.
- Source branch used for this line of work: `codex/low-poly-petal-flowers`.

## 0.1.0 - Initial Version

Original DailyFlora screensaver baseline.

- Pure frontend Three.js daily bouquet.
- Date-seeded deterministic bouquet generation.
- Basic particle flowers, leaves, branches, density controls, render controls, and camera motion.
