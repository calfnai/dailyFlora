# Reference Flower Shapes Codex Handoff

## Purpose

`reference-flower-shapes/` is a reference-only library for DailyFlora flower primitive judgment. It exists to reduce over-abstraction in generated flower shapes without turning DailyFlora into a third-party asset collage.

## Rule

Do not import external photos or third-party 3D models into the production renderer unless the user explicitly approves and the license is verified. Prefer link-only observations and shape summaries.

## Current started shape

- `trumpet-throat-form`
- Main file: `trumpet-throat-form.md`
- Sample log: `trumpet-throat-samples.json`
- Source notes: `sources-trumpet-throat.md`

## Key trumpet-throat shape anchors

The current conclusion is:

> six-tepal star backing + independent cup/corona/trumpet projecting forward + wavy/frilled rim + dark throat with small stamens/style detail + green tube/ovary/spathe connection.

Codex should not simplify this to “a cone in the middle of a flower.”

## Continuation tasks

1. Fill `trumpet-throat-samples.json` from 10 to 80 observed samples.
2. Keep source URLs and license notes per sample.
3. After 80 observations, evaluate the current primitive against the anchors.
4. If code changes are needed, update:
   - `src/floraPrimitives.ts`
   - `src/primitiveLab.ts`
   - `src/flowerPlans.ts` if bouquet usage changes
   - `data/aesthetic-review-dashboard.json` if review status changes
   - `CHANGELOG.md`
5. Run `npm run build` before reporting code changes.
