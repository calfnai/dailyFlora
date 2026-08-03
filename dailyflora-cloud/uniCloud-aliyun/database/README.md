# DailyFlora uniCloud database

The target service space is Aliyun `dailyflora`:

- SpaceID: `mp-7937f272-ccea-46ee-ac33-3e23abb1fa49`
- Provider: `aliyun`

Create these collections in the uniCloud Web console before the first upload:

1. `uni-id-users` — used by the DailyFlora API for the account records.
2. `dailyflora-sessions` — private session hashes; add an index on `tokenHash` and an index on `expiresAt`.
3. `dailyflora-favorites` — apply `dailyflora-favorites.schema.json` and its two indexes.
4. `dailyflora-password-resets` — one-time password-reset hashes with a TTL index.
5. `dailyflora-generations` — private generation history.
6. `dailyflora-gardens` — one private cross-device garden document per user.
7. `dailyflora-reference-images` — private object-storage metadata.
8. `dailyflora-processing-tasks` — queued/processing/completed reference-image tasks.
9. `dailyflora-points-ledger` and `dailyflora-demo-orders` — demonstration-only records.

The API never exposes password hashes, session hashes, object-storage file IDs, or cross-user records. Collection access is performed inside the cloud function, not through public clientDB rules.

Configure the UniCloud object storage permission for the reference-image path as private. The API writes only to `dailyflora/private/<userId>/...`; users receive task status and results, not a public object URL. Authorized Admin processing can request a short-lived URL through the protected `adminGetReference` action.

Set the cloud-function environment variable `DAILYFLORA_ADMIN_EMAILS` to a comma-separated allowlist before using `/admin/`. Keep DirectMail variables (`DIRECTMAIL_ACCESS_KEY_ID`, `DIRECTMAIL_ACCESS_KEY_SECRET`, `DIRECTMAIL_ACCOUNT_NAME`, and optional `DIRECTMAIL_FROM_ALIAS`) in the cloud-function environment only.

The schema files in this directory can be imported from the HBuilderX cloud database panel. If the service space already has the official `uni-id-users` template, keep that template and add only the DailyFlora consent fields required by this project.
