# DailyFlora legal release checklist

This is an internal maintenance document. Do not link it from the public site.

Before each public release, compare the implementation with `/legal/terms/`,
`/legal/privacy/`, `/legal/credits/`, and `/legal/copyright/`.

Update the public legal pages before shipping any of the following:

- real accounts, authentication, Supabase tables, RLS, or cross-device sync;
- server-side image uploads, object storage, or persistent private bouquets;
- saved camera frames, video, screenshots, or hand images;
- analytics, advertising, cookies, crash reporting, or session replay;
- payments, subscriptions, Credits purchases, refunds, or order fulfilment;
- email, push notifications, social-platform integrations, or contact forms;
- public profiles, public user content, comments, publishing, or moderation;
- new fonts, icon libraries, media, models, reference assets, or code that
  requires attribution or a reproduced license notice.

For every change, verify:

1. what information is collected, where it is processed, and where it persists;
2. whether the feature is local, experimental, public, authenticated, or paid;
3. the deletion path and the user-facing control;
4. sharing and visibility boundaries;
5. each third-party provider, version, purpose, license, and policy link;
6. the effective date and last-updated date;
7. consistent attribution to `CALFN LAU`, contact at `find@calfn.com`, and
   `© 2026 CALFN LAU. All rights reserved.`
