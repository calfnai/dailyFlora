# DailyFlora uniCloud

`dailyflora-cloud/` is the dedicated HBuilderX / uni-app cloud project. `uniCloud-aliyun/` is the provider-specific server-side directory that HBuilderX uploads after the project is associated with the existing Aliyun service space.

## Service-space binding

In HBuilderX ARM64, open this project and use the `uniCloud-aliyun` directory menu to associate the existing service space:

- Provider: `aliyun`
- Space name: `dailyflora`
- SpaceID: `mp-7937f272-ccea-46ee-ac33-3e23abb1fa49`

Do not put the Aliyun `clientSecret` in GitHub or in Vite environment variables. The browser calls only the URLized `dailyflora-api` function. Configure its HTTP path in the uniCloud console, for example `/http/dailyflora-api`, then set `VITE_DAILYFLORA_API_BASE` to the resulting URL base without the trailing slash.

## Upload order

1. Upload the database schemas in `database/`.
2. Configure object storage permissions so `dailyflora/private/` is private.
3. Upload `cloudfunctions/dailyflora-api`.
4. Configure the function URL path `/http/dailyflora-api` and CORS/custom request domain as needed.
5. Set `DAILYFLORA_ADMIN_EMAILS` and DirectMail credentials in the cloud-function environment only.
6. Set the frontend runtime API configuration from `dailyflora-config.js` or a local build variable; never commit secrets.
7. Test `health`, registration, login, `me`, favorites isolation, generation history, garden isolation, private upload, queued tasks, and logout before enabling the cloud path for public users.

The Vite frontend exposes `/admin/` as a real route, but the route remains locked unless the authenticated email is in `DAILYFLORA_ADMIN_EMAILS`. It is not a replacement for cloud-side authorization.

The current 0.71.0 release remains local/mock-only. Cloud integration is versioned separately so the already-published acceptance build remains reproducible.
