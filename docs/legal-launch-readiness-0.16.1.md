# DailyFlora 0.16.1 legal launch readiness

Updated: 2026-08-03

This checklist separates publishable policy copy from product controls that must exist before the production registered upload is enabled. A privacy policy alone does not create compliance.

## Current 0.16.1 browser demo

- Account name/email, favorites, generation records, and preferences use browser `localStorage`.
- A selected reference photo is read with `FileReader` and `Canvas` in the page. The image file is not written to `localStorage` or sent to a DailyFlora server.
- Camera frames are processed in the page by MediaPipe after permission. DailyFlora does not record frames or implement face recognition.
- Hosting providers may process ordinary request/security logs.

## Blockers before production cloud photo upload

1. Publish the operator's complete legal identity, service address, and any required company/registration details. Email alone may not satisfy every consumer-commerce or regulatory context.
2. Select the account database, object-storage, CDN, email, logging, and support vendors. Record their legal entities, processing locations, subprocessors, retention, security, deletion APIs, and data-processing agreements.
3. Build separate just-in-time upload consent and notice. It must name the provider, country/region, purpose, data types, retention, recipients, deletion control, and cross-border mechanism.
4. Make uploads private by default. Use authenticated, expiring access URLs; encryption in transit and at rest; least-privilege access; audit logs; and an employee/contractor access policy.
5. Remove unnecessary EXIF and precise geolocation metadata before durable storage. Do not implement face recognition or biometric identification without a new assessment and explicit legal basis.
6. Enforce the stated lifecycle: original photo deletion within 30 days after generation or earlier on request; account deletion; derived-record deletion; backup roll-off within an additional 30 days; and documented legal-hold exceptions.
7. Add access, export, correction, deletion, consent-withdrawal, objection/opt-out, and complaint workflows. Verify response deadlines by jurisdiction and preserve a minimal request log.
8. Add age gating. Do not accept registration, photo, or camera use from users under 16. If child-directed use is ever introduced, build a separate child policy and verifiable guardian-consent system first.
9. Complete data-flow mapping, privacy impact/data-protection impact assessments where required, vendor risk review, incident response, breach-notification matrix, access review, and periodic deletion tests.
10. Determine international-transfer routes before launch: China PIPL transfer route and separate consent where required; EU/EEA adequacy or Standard Contractual Clauses plus transfer assessment; Japan APPI foreign-third-party disclosures/consent or qualifying framework; and applicable U.S. state processor contracts.
11. Confirm whether CCPA/CPRA or another U.S. state law applies by threshold and activity. Honor universal opt-out signals if sale, targeted advertising, or covered profiling is introduced. The present product commitment is no sale and no cross-context targeted advertising.
12. Register a U.S. DMCA designated agent only if DailyFlora intends to rely on DMCA safe-harbor procedures for hosted user content; do not claim registration before it exists.

## Rights and attribution blockers

- Preserve Three.js MIT and MediaPipe Apache-2.0 notices in distributed source/artifacts.
- Preserve the Andrew Butko / Wikimedia Commons CC BY-SA 3.0 credit, source, license link, and modification note wherever the reference copy or an adaptation is distributed.
- Preserve the NGC 2787 credit: NASA/ESA and The Hubble Heritage Team (STScI/AURA), with the official source link and no endorsement claim.
- `public/special/ladyfingers-lofi.mp3` has metadata but no repository source/license document. Do not treat it as cleared for public or commercial distribution. Obtain written authorization or replace it with a properly licensed track before release.
- Confirm authorization and privacy status for owner-provided special bouquet reference photographs before public distribution.

## Required professional review

Before accepting real user photos or payments, have qualified counsel in the actual operating jurisdiction review the operator identity, Terms, Privacy Policy, consumer-sales terms, cross-border setup, age design, vendor contracts, and rights-clearance file. The 0.16.1 documents are an implementation-aligned legal baseline, not a substitute for that review.
