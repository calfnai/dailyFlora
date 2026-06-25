# DailyFlora 0.12E 免费 MVP 架构

最后更新：2026-06-25

## 目标

0.12E 的目标是做一个免费、可部署、可继续开发的网页版 MVP。预估测试用户不超过 20 人。

当前不租服务器，不做完整商业会员系统，不为 APK、iOS App、Mac App 或屏保平台建立独立工程。其他端只保留技术路线。

## 基础托管

默认继续使用 GitHub Pages 托管静态网页。GitHub Pages 官方定义是从仓库发布 HTML、CSS、JavaScript 等静态文件的服务，并且不支持 PHP、Ruby、Python 这类服务端语言。

这意味着：

- GitHub Pages 适合托管 DailyFlora 的网页前端。
- GitHub Pages 不能直接作为安全的用户写入数据库。
- 不能把 GitHub 写入 token 放进前端代码里。
- 公开仓库里的 JSON 可以作为只读数据源，但不能存放用户隐私。

参考：

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 0.12E 数据策略

### 阶段 1：本地优先

先把用户、收藏、分享、生成记录存到浏览器本地。

适用范围：

- 单人或小范围体验。
- 验证 UI、字段、产品节奏。
- 不承诺跨设备同步。

数据位置：

- `localStorage`
- 未来可升级到 `IndexedDB`

### 阶段 2：GitHub 托管只读数据

每日公开花束、版本说明、credits、示例数据可放在仓库中，由 GitHub Pages 读取。

适用范围：

- 每日花束索引
- 公共主题
- 公共示例
- Credits / Terms / EULA

不适合：

- 用户密码
- 私人收藏
- 用户上传图片
- 付费状态
- 任何不能公开的数据

### 阶段 3：免费外部后端候选

当确实需要跨设备账号和用户写入时，再选一个免费层服务。候选方向：

- Supabase Free：认证、Postgres、对象存储。
- Firebase Free：认证、Firestore、Storage。
- Cloudflare Pages + D1 / KV：静态托管加轻量数据库。

这一步不属于 0.12E 必做范围，只保留适配空间。

## 用户字段预留

内部字段先使用中性命名，避免过早决定前台叫“会员”还是其他称呼。

- `userId`
- `displayName`
- `handle`
- `emailHash`
- `createdAt`
- `lastSeenAt`
- `authProvider`
- `status`
- `plan`
- `entitlements`
- `aestheticProfile`
- `legalConsent`

## 收藏和分享

收藏夹和分享夹要分开记录。

原因：分享过但没有收藏，本质上也是一种用户表达。用户以后可能想找回“我发出去过的那束花”。

最小字段：

- `userId`
- `bouquetId`
- `savedAt` 或 `sharedAt`
- `source`
- `shareTarget`
- `note`

## 个人审美池

用户输入文本或图片后生成的花束，不等于每日公共花束。

最小字段：

- `inputId`
- `userId`
- `inputKind`
- `text`
- `imageAssetId`
- `createdAt`
- `derivedAestheticTags`
- `generatedBouquetId`
- `revisionOf`
- `dailyGenerationKey`

0.12E 只预留字段。真正的 AI 图文理解、付费额度和多轮修改以后再接。

## 版本路线

- `0.12`：当前纯前端视觉作品主线。
- `0.12E`：Extended 定义版，增加数据字段、产品 abstract、免费 MVP 边界。
- 后续 `E` 版本：逐步接入真实数据写入、账号、跨设备同步、会员权益。

## 其他端路线

当前不开发其他端，但保留路线：

- iOS / iPadOS：优先用网页核心加 Capacitor 或原生 WebView 壳。
- Android / APK / TV：优先复用网页核心，按设备性能切换质量档。
- Mac App：先做全屏 ambient app，再考虑 Mac App Store。
- 屏保平台：优先输出 HTML/WebGL 包或视频素材。
- TouchDesigner：用于视觉实验和参数母版，不作为公开网页的运行时。

