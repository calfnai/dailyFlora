# DailyFlora Changelog

## 0.14.2 - 2026-07-03

Simpler home page navigation and signup landing.

- Removed the home-page personal garden panel, favorite button, collection list, and reference-upload flow so the bouquet viewing page stays visually quiet.
- Added a top-right site menu with About, Member, Downloads, Bouquet Shop, signup/favorite guidance, and the debug review link when debug mode is enabled.
- Added `signup/index.html` as the registration landing page explaining why users would register: saving bouquets, uploading references, generating personal flowers, keeping history, and future credits.
- Kept collections and generated bouquets inside the member flow instead of the public home page.

## 0.14.1 - 2026-07-03

Member mockup upload-to-bouquet flow.

- Rebuilt `docs/member-test.html` from an information outline into a product-style user center mockup with account stats, credits, navigation, generation history, and account/order placeholders.
- Added a front-end upload recognition demo: image preview, average-color palette extraction, preference/style inference, primitive chips, mock bouquet preview, live bouquet link, and append-only generated records.
- Kept the flow local-only for MVP: no real upload, no database write, no payment integration.

## 0.14.0 - 2026-07-03

MVP route structure and accepted aesthetic baseline.

- Added the low-cost MVP route structure: public placeholders for `about`, `bouquet-shop`, `member`, and `downloads`, plus the internal development index and mock member/admin pages.
- Reworked the fixed bouquet sample page into a lightweight card library with category, sorting, page-size controls, and explicit live-render links instead of loading many 3D iframes at once.
- Recorded the owner's confirmation that the current aesthetic groups can be marked as `pass`: Dewberry Morning, Summer Pinwheel, Fairy Violet, Narcissus Season, Breathing Landscape, Foxtail Lily, Berry Grove, Autumn Juice, Lychee Garden Rainbow, and the negative boundary set.
- Promoted the dashboard gate to the 0.14 accepted aesthetic baseline; future changes should come from actual running-page feedback rather than treating these groups as pending blockers.
- Bumped the npm version to `0.14.0` and product version to `0.14`.

## 0.13.5 - 2026-07-02

Lychee Garden accepted and daily automation scheduled.

- Recorded the owner's acceptance that `荔枝花园彩虹 / Lychee Garden Rainbow` is good.
- Moved the Lychee Garden dashboard card from `needs-owner-review` to `pass`.
- Preserved the dedicated `lychee-garden-rainbow` address as the accepted route for this bouquet.
- Created a daily idle-time Codex automation to build the daily bouquet and deploy DailyFlora to GitHub.

## 0.13.4 - 2026-07-02

Dedicated Lychee Garden bouquet address.

- Added a standalone `lychee-garden-rainbow` theme instead of previewing the new bouquet through `dopamine-field`.
- Added the matching `lychee-garden-rainbow` flowerPlan with owner-provided reference notes, role-specific rainbow color distribution, branch-owned lychee fruit dots, airy pale clusters, and green outward branch lines.
- Added dedicated primitive and palette mappings for the new plan in the high-quality bouquet renderer.
- Added the dedicated URL to the flower-plan sample page and aesthetic review dashboard.
- Recorded the rule that a new flower needs its own address; if the flower is rejected later, discard that address instead of reusing another bouquet address.

## 0.13.3 - 2026-07-02

Owner-provided daily inspiration intake.

- Added the owner-provided Xiaohongshu reference `Lychee Garden｜捏一个彩虹🌈` as a pending inspiration item, preserving the original short link and resolved public note URL.
- Extended the owner-link ingest script so `xhslink.com` short links resolve before note-id extraction.
- Added compact inference for rainbow / multi-color and lychee-garden cues: controlled multi-hue color, green and pale-air buffers, branch-owned fruit points, small blooms, and airy natural silhouette.
- Added the same reference to the aesthetic review dashboard as `荔枝花园彩虹 / Lychee Garden Rainbow`, with role review, positive signals, negative constraints, primitive mapping, and next tasks.
- Kept the reference pending-confirmation; it does not automatically change generation rules or mark a new aesthetic direction as passed.

## 0.13.2 - 2026-07-01

Daily rollover behavior.

- Added an automatic local-midnight rollover for the default daily bouquet mode, so a page left open overnight rebuilds into the new day's date seed.
- Kept manually selected dates, random date previews, fixed shared seeds, and special bouquet routes pinned instead of forcing them back to today.

## 0.13.1 - 2026-06-26

Review role and primitive vocabulary correction.

- Replaced the loose `CTO` review role with `生成架构审查`, focused on controllable Three.js structure, scale, placement, orientation, performance, and debug data.
- Added `花材库管理员` as a dashboard review role so reusable shapes used in flower plans or renderers must be registered in the Target Shape Vocabulary.
- Registered `CosmosOpenFlower / 波斯菊/小面花型` as the 16th target shape after the user identified the untracked small open-face flower in `山岗小花` and `热带丛林`.
- Reduced `CallaCurledBract` scale inside full bouquet composition while keeping the accepted single primitive intact.
- Shortened and faded the lower green fake stems on `UmbelMiniCluster` so distant/high placements no longer read as an unnatural inverted triangle.
- Recorded the related `FruitPodCluster` structural risk as lighter and currently observation-only.

## 0.13.0 - 2026-06-26

Aesthetic operating-system release.

- Added `docs/dailyflora-aesthetic-system-0.13.md` as the project-level aesthetic memory: target bouquet taste, negative constraints, foliage rules, primitive gate, composition lessons, color rules, review workflow, and debug review entry.
- Added `docs/dailyflora-codex-skill.md` as the project Codex skill for future DailyFlora work.
- Added `.codex/skills/dailyflora/SKILL.md` as a project-local skill entrypoint.
- Updated README, project abstract, and handoff docs so new Codex threads start from the 0.13 memory instead of relying on chat context.
- Added the 0.13 aesthetic memory link to the review dashboard and copied key markdown review docs into the GitHub Pages deploy output.
- Bumped `package.json` to `0.13.0` and `productVersion` to `0.13`.

## 0.12.26 - 2026-06-26

Review library page restoration.

- Fixed the GitHub Pages deploy step so it no longer overwrites Vite-built dashboard pages with raw source HTML.
- Restored working compiled scripts for the aesthetic dashboard and Primitive Lab on the published site.
- Added fixed dashboard entry cards for the reference image library, primitive flower library, and fixed bouquet sample library.
- Added the reference gallery and legacy reference card page to the source deploy manifest.
- Updated dashboard copy so the 15 primitive library is shown as user-confirmed passing the minimum gate, not still waiting for review.

## 0.12.25 - 2026-06-26

Debug mode and interaction corrections.

- Added URL-gated debug mode with `?debug` / `?debug=1`.
- Moved aesthetic-review dashboard access into debug mode only; the dashboard page itself now requires the debug parameter.
- Added a debug stats panel showing current render FPS, target FPS, render/density mode, canvas/DPR, draw calls, triangles, point/line counts, GPU resource counts, and JS heap when available.
- Reversed only the vertical drag pitch direction; horizontal drag behavior is unchanged.
- Moved the play/pause button into the camera route control, immediately left of the reverse button.

## 0.12.24 - 2026-06-26

Aesthetic review entry and original bouquet candidate.

- Restored a visible aesthetic-review dashboard entry in the main controls, available even when viewing controls are collapsed.
- Added the original `dewberry-morning` / `晨露莓园` bouquet theme and `dewberry-morning-air` flower plan.
- Mapped the new plan to accepted primitives with dedicated palette rules: small open flowers, mist clusters, dewberry fruit dots, cup blooms, ruffled low blooms, outward spike lines, and coral star line petals.
- Added the new bouquet candidate to the aesthetic dashboard as `needs-owner-review`, not as a passed direction.

## 0.12.23 - 2026-06-26

HUD and calendar control restoration.

- Restored the visible bilingual bouquet title in the HUD instead of keeping English only in hover text.
- Anchored the native date picker to the calendar button wrapper so the picker opens from the right UI location.
- Recorded hillside-wild as the current strongest composition reference: small-flower matrix, interspersed line flowers, low cluster support, and outward air.

## 0.12.22 - 2026-06-26

Open spike direction correction.

- Kept the interspersed spike placement from `0.12.21`, but changed spike orientation to open outward from the bouquet structure.
- Reduced inward-gathering spike angles so vertical flowers read as airy and expansive instead of converging.
- Added only light side-crossing variation to preserve natural weaving without closing the silhouette.

## 0.12.21 - 2026-06-26

Spike composition correction.

- Varied each main-bouquet `SpikeFlower` orientation so straight spikes no longer all extend in one uniform direction.
- Rebalanced the hillside / foxtail-lily plan so spike flowers intersperse through the bouquet instead of forming a top-heavy patch.
- Reduced hillside spike dominance by moving more share into small flowers and low cluster volume.

## 0.12.20 - 2026-06-26

Foliage primitive spatial correction.

- Reworked `FoliageGrassBranch` from a root-like top-heavy grass fan into a branch-line material with leaves distributed along a stem.
- Reduced standalone foliage accent density in the high-quality bouquet and biased those accents closer to bouquet structure.
- Adjusted the dashboard target-shape preview angle for foliage so it reads as branch/leaf line material.

## 0.12.19 - 2026-06-26

Default camera distance correction.

- Pulled the default bouquet camera farther back so the full bouquet is readable after primitive-library rendering.
- Increased the manual zoom-out range to keep whole-bouquet viewing available.

## 0.12.18 - 2026-06-26

Spike and camera viewing controls.

- Reworked `SpikeFlower` back to a straight vertical spike, removing the unified curved-stem look.
- Kept only tiny seed-based lean and per-floret variation so any bend is not a repeated uniform curve.
- Added manual zoom controls to the main bouquet page with zoom in / zoom out buttons.
- Added mouse wheel / trackpad zoom on the bouquet canvas.

## 0.12.17 - 2026-06-26

Primitive library applied to the main bouquet.

- Embedded live Three.js primitive previews directly into the TARGET SHAPE VOCABULARY cards.
- Switched high-quality main bouquet rendering from the old flower-type geometry to the accepted primitive factory library.
- Mapped existing flower plans to the 15 primitive categories, with foliage accents added from the primitive library.
- Left low and medium render modes on the lighter previous geometry path for performance.
- Did not add a new aesthetic review round in the dashboard.

## 0.12.16 - 2026-06-26

Primitive Gate owner acceptance.

- Recorded the owner's confirmation that the Primitive Gate / flower-library acceptance has reached the pass line.
- Updated the aesthetic dashboard gate from `needs-work` to `pass`.
- Marked all 15 primitive-library entries as passing the current flower-library gate, while keeping their prior correction notes as history.
- Moved reference review groups from primitive-blocked to composition `needs-work`.
- Updated Primitive Lab copy so the next stage is controlled composition validation, not more primitive blocking.
- Kept the main bouquet renderer unchanged in this version.

## 0.12.15 - 2026-06-26

Primitive Lab second owner-review repair pass.

- Split primitive 2 and 3 more aggressively: `LayeredDahliaFlower` now uses narrow, pointed, multi-ring radial petals, while `RuffledRoseFlower` uses wider, cupped, inward-ruffled petals.
- Reworked `DaturaTrumpetFlower` away from a single trumpet object into five flared lobes surrounding a smaller throat.
- Kept the corrected `OrchidButterflyFlower` proportions while rolling petal angles back toward the earlier better direction.
- Extended the outer curl of `CallaCurledBract` so the spathe closes further along the current curl direction.
- Repaired `SpikeFlower` from a capsule-string look back toward small florets arranged along a vertical spike.
- Adjusted `UmbelMiniCluster` flower-facing angles and added tiny centers to reduce the one-sided viewing problem.
- Reduced `FruitPodCluster` berry size and increased branch-tip density.
- Rebuilt `HangingBellFruit` as hanging bell/lantern fruit instead of capsule placeholders.
- Updated Primitive Lab and dashboard owner-review text for 2, 3, 7, 8, 9, 10, 11, 13, and 14.

## 0.12.14 - 2026-06-26

Primitive Lab 4-9 owner-review repair pass.

- Repaired `StarPinwheelFlower` by moving back toward the more coordinated earlier structure, with a smaller center and less awkward petal extension.
- Rebuilt `TulipCupFlower` around a semi-closed cup with spoon-like petals instead of a ball-core or petal-bucket shape.
- Kept `TrumpetThroatFlower` direction and made a smaller refinement to clarify the outer-petal and trumpet-center relationship.
- Rebuilt `DaturaTrumpetFlower` with a continuous flared trumpet surface, deep throat, and overturned rim instead of cone/torus symbolic geometry.
- Kept `OrchidButterflyFlower` stamen structure while adjusting the four-petal proportions.
- Rebuilt `CallaCurledBract` as a single curled spathe with a central spadix.
- Added owner-review status text for primitives 4-9 in Primitive Lab and the aesthetic dashboard.
- Kept the main bouquet renderer unchanged; none of these primitives are marked passed until owner review.

## 0.12.13 - 2026-06-25

Owner review fixes for the primitive flower library.

- Renamed and redirected the former layered rose target toward a layered dahlia / full petal-head form based on the owner reference.
- Reframed the ruffled round form as the rose-like form because it read closer to rose than the previous layered form.
- Reduced the star/pinwheel center and lengthened its petals to better match the Summer Pinwheel reference.
- Reworked tulip/cup, calla/curled bract, spike, umbel mini cluster, hydrangea cloud, and foliage/grass/branch primitives based on owner feedback.
- Added separate Datura trumpet and hanging bell fruit primitives, expanding the review library from 13 to 15 displayed categories.
- Changed the dashboard wording from Primitive Gate to user-facing flower-library acceptance language.

## 0.12.12 - 2026-06-25

Thirteen primitive shape implementation.

- Expanded `src/floraPrimitives.ts` from the old 7 displayed categories to 13 owner-review primitive factories.
- Added concrete primitives for ruffled round flowers, star/pinwheel flowers, tulip/cup forms, trumpet/throat flowers, orchid/butterfly forms, calla/curled bracts, umbel mini clusters, hydrangea cloud clusters, fruit/pod clusters, and foliage/grass/branch material.
- Updated Primitive Lab to instantiate and display the 13 review categories.
- Updated the aesthetic dashboard gate so the 13 primitives are implemented but still marked `needs-work` pending owner review.

## 0.12.11 - 2026-06-25

Target flower-shape vocabulary correction.

- Clarified that the current 7 Primitive Lab categories are only a v0 coarse classification.
- Added a 13-category target shape vocabulary to the aesthetic review dashboard data and page.
- Updated Primitive Lab copy so it no longer implies the current 7 categories are enough to cover mainstream bouquet forms.
- Updated handoff notes to keep future work aligned with the 13-category vocabulary before composition work continues.

## 0.12.10 - 2026-06-25

Reusable foliage aesthetic rule.

- Added a reusable foliage and green-material rule to the aesthetic review dashboard data.
- Dashboard now separates cross-reference aesthetic rules from per-reference-card observations.
- Clarified that foliage supports spatial feeling, spring-like freshness, saturation balance, breathing distance, and edge rhythm, not physical flower support.
- Clarified owner acceptance for foliage aesthetics; Codex records evidence and proposals but does not mark this aesthetic gate passed on its own.

## 0.12.9 - 2026-06-25

Aesthetic review dashboard gate.

- Added `docs/aesthetic-review-dashboard.html` as a human-readable review gate before further main bouquet visual changes.
- Added `data/aesthetic-review-dashboard.json` to record reference groups, visual signals, primitive mappings, role reviews, status, failure reasons, and next tasks.
- Dashboard now makes the current blocked state explicit: primitive lab must pass hidden-label recognition before composition work continues.
- Added reference-gallery anchors and deploy/build wiring so the review dashboard can be published with the static site.

## 0.12.8 - 2026-06-25

Primitive lab acceptance tightening.

- Strengthened the seven primitive visual signatures instead of moving on to bouquet composition.
- Disk flowers now have a larger center disk, uneven drooping petals, and edge jitter particles.
- Layered round flowers now use a deeper cup structure with tighter inner petals and looser outer overlap.
- Spike flowers now vary floret scale and density from bottom to top instead of reading as an even bead stick.
- Open sculptural flowers now open asymmetrically with a dominant petal, side petals, throat, and stamen.
- Cluster flowers now place micro-flowers on a lumpy outer surface rather than filling a random bubble cloud.
- Berry clusters now build a branch skeleton first, with berries only at branch tips and small highlight points.
- Air filler now attaches dots to fine branching lines to avoid uniform starfield noise.
- Primitive lab now hides labels by default and adds isolate, front/side/top view, silhouette, grid, and performance stat controls.
- Main branch source sync is required for this lab; do not maintain only minified `gh-pages` assets.

## 0.12.7 - 2026-06-25

Primitive lab for readable floral geometry.

- Added `src/floraPrimitives.ts` with seven reusable Three.js flower-material primitives: disk flower, layered round flower, spike flower, open sculptural flower, cluster flower, berry cluster, and air filler.
- Added `docs/primitive-lab.html` and `src/primitiveLab.ts` so each primitive can be reviewed on its own before being merged back into full bouquet generation.
- Added the primitive lab as a Vite HTML build entry so it can be published with the site.
- Kept the main bouquet renderer unchanged in this step; this is an intentional test layer before replacing high-detail bouquet geometry.

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
