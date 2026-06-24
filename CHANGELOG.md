# DailyFlora Changelog

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
