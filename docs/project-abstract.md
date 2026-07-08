# DailyFlora Project Abstract

最后更新：2026-07-03

## 当前产品版本

`0.14`

`0.14` 是审美基线通过和低成本 MVP 路由版本。它继承 `0.13` 的审美操作系统，把当前 dashboard 中的主要审美组标记为通过基线，并补上客户页占位、开发组目录、用户中心测试、临时后台和轻量固定样例库。

`package.json` 的 `version` 字段继续使用 npm 合法版本格式。面向产品、文档和路线图时，以 `productVersion` 和本 abstract 中的版本为准。

## 项目一句话

DailyFlora 是一个每天生成一束数字花的网页作品。它从日期、审美参数和用户输入中生成可复现的 3D 花束，让花束既可以像屏保一样安静存在，也可以成为一个可收藏、可分享、可慢慢养成的个人审美空间。

## 开发初心

DailyFlora 的起点不是做一个功能很多的花店工具，而是做一个有持续性的日常视觉仪式：

- 每天打开，都能看到一束新的花。
- 花不是照片，也不是固定模板，而是由规则、随机性和审美判断共同生成。
- 花束应该适合长时间观看，能放在办公室电脑、家中屏幕、平板或手机上作为安静的视觉陪伴。
- 它需要有中国当代花艺和社媒审美语境，不默认照搬欧美婚礼花艺、Pinterest 风格或通用图库审美。
- 它最终可以成为一个产品，但产品功能必须服务于“每天一束花”和“个人审美池”，不能压过作品本身。

## 0.13 的定位

0.13 将 DailyFlora 从“已经能生成一些不错的花束”推进到“知道为什么这样生成、下一次该怎么继续”的阶段。

本版本固定四类项目记忆：

1. 用户真正想要的花束审美。
2. 已经被否定的方向和常见错误。
3. Primitive Lab、composition、palette、camera/UI 的修改门禁。
4. 新 Codex 线程接手项目时必须读取和执行的 skill。

关键文件：

- `docs/dailyflora-aesthetic-system-0.13.md`
- `docs/dailyflora-codex-skill.md`
- `.codex/skills/dailyflora/SKILL.md`
- `docs/codex-aesthetic-handoff.md`

## 0.14 的定位

0.14 不急着接真实数据库、支付或完整后台。它先把页面结构和数据边界摆出来：

1. 客户侧：`/about/`、`/bouquet-shop/`、`/member/`、`/downloads/`。
2. 开发侧：`/docs/dev-index.html` 作为开发组总目录。
3. 用户侧原型：`/docs/member-test.html` 展示资料、生成记录、上传、积分、订单和获奖入口。
4. 管理侧原型：`/docs/admin-bouquets.html` 和 `/docs/admin-users.html` 展示未来花花库、用户、积分和审计日志。
5. 固定样例库：直接嵌入 3D 花束预览，用分页和 `preview=1` 模式控制加载压力。

数据库仍是未来能力。当前只记录 `users`、`bouquets`、`generations`、`uploads`、`credits`、`subscriptions`、`orders`、`admin_audit_logs` 等数据域，不绑定具体服务商或付款方式。

## 0.12E 的定位

0.12E 是 DailyFlora 从“单页视觉作品”走向“轻量产品 MVP”的定义版本。

本版本不租服务器，不引入复杂后端，不承诺完整会员系统。它只做三件事：

1. 保留当前网页观看形式和 GitHub Pages 部署路径。
2. 把未来账号、收藏、分享、会员、个人生成、法务声明需要的数据字段先定义清楚。
3. 约定免费 MVP 的数据策略：20 个以内测试用户，先用本地存储、静态 JSON、手动同步或免费静态托管周边能力完成验证。

## Extended 能力范围

0.12E 预留以下能力，但不要求一次性完成：

- 用户注册字段
- 用户等级和生成额度字段
- 日历花束索引
- 收藏夹
- 分享夹
- 用户意见和审美输入
- 用户输入生成的个人花束
- 每日生成次数限制
- 分享海报和分享记录
- Terms、Privacy、EULA、Credits、License 声明

## 数据原则

DailyFlora 的核心数据不是最终截图，而是可复现的 `BouquetSpec`。

每日花束、收藏、分享、个人生成、屏保和未来 App，都应该尽量指向同一类花束规格数据。这样即使渲染端未来从 Three.js/WebGL 扩展到 WebGPU、App 壳或屏保平台，产品数据仍然可以沿用。

## 与 Changelog 的关系

`CHANGELOG.md` 记录已经完成的具体改动。

本 abstract 记录项目为什么这样做、版本命名如何理解、产品边界如何判断。以后每个重要版本都应该同时更新 abstract 和 changelog；changelog 不替代 abstract。
