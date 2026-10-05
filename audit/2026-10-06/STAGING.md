# DailyFlora isolated remote staging — 2026-10-06

## Verified

- Test service space: Alipay Cloud `daily-fora` (`env-00jy6xjkcayy`), separate from the formal site's former space.
- `dailyflora-api-beta` was uploaded from this branch via HBuilderX. HTTPS health responds with `code: 0` and allows the staging static-host origin.
- Frontend build (`npm run build:vercel`) passes. Cloud regression tests pass 9/9 and Beta tests pass 16/16.
- The new static-host default domain is `env-00jy6xjkcayy-static.normal.cloudstatic.cn`.

## Remaining acceptance gates

- Confirm uploaded static files over the default HTTPS domain and test guest/member/Admin browser flows.
- Confirm private storage ACL with an anonymous fetch and complete real database transaction checks.
- Connect a remote image-generation processor before enabling reference-image task submission. The staging frontend disables that submission to avoid charging points for unprocessed tasks.
- Configure and verify real password-reset email delivery, then test three-role flows and mobile/desktop UI.
- The default static domain is for testing. Confirm its public traffic limits and global performance before using it as a permanent commercial domain.
