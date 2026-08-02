# DailyFlora uniCloud database

The target service space is Aliyun `dailyflora`:

- SpaceID: `mp-7937f272-ccea-46ee-ac33-3e23abb1fa49`
- Provider: `aliyun`

Create these collections in the uniCloud Web console before the first upload:

1. `uni-id-users` — used by the DailyFlora API for the account records.
2. `dailyflora-sessions` — private session hashes; add an index on `tokenHash` and an index on `expiresAt`.
3. `dailyflora-favorites` — apply `dailyflora-favorites.schema.json` and its two indexes.

The API never exposes password hashes, session hashes, or cross-user records. Collection access is performed inside the cloud function, not through public clientDB rules.

The schema files in this directory can be imported from the HBuilderX cloud database panel. If the service space already has the official `uni-id-users` template, keep that template and add only the DailyFlora consent fields required by this project.
