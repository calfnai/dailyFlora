# DailyFlora 用户注册与数据库选型（2026-07-20）

## 结论

DailyFlora 的第一批真实用户建议直接进入 **uniCloud 支付宝云免费服务空间**，而不是先把用户放进 GitHub、Vercel 临时数据库或 Codex Sites。

原因：

1. GitHub Pages 只托管静态 HTML、CSS、JavaScript，不提供用户数据库或安全的服务端注册逻辑。
2. Vercel 已不再提供自有 Postgres；数据库来自 Marketplace 的 Neon、Supabase 等第三方服务。
3. Supabase 免费版很适合纯 Web 原型，且 Postgres 数据可用标准工具导出；但以后迁移到 uni-id 时，密码哈希、登录身份和会话需要额外迁移设计。
4. 项目已经准备进入 HBuilderX / uni-app 环境。uni-id-pages 原生覆盖 App、H5、Web 和小程序，直接从第一位用户开始使用同一账户体系，风险最低。
5. 支付宝云免费空间的数据库读写额度明显高于阿里云免费空间，更适合小规模公开注册。

这不是永久锁定。uniCloud 支持将表导出为 JSONL，并支持在云厂商之间迁移。正式上线前必须建立独立导出备份和稳定用户 ID，避免将业务数据绑定到供应商内部 `_id`。

## 方案比较

| 方案 | 免费起步 | 注册能力 | 数据可迁移性 | 国内正式使用 | 本项目判断 |
| --- | --- | --- | --- | --- | --- |
| GitHub / GitHub Pages | 是 | 无服务端注册 | 不适用 | 仅适合静态站 | 排除 |
| Vercel + Supabase Free | 是 | 邮箱、社交登录、JWT、RLS | 很强，标准 Postgres、`pg_dump` | 数据库区域只有东京/首尔/新加坡等境外区域 | Web 原型备选 |
| Vercel + Neon Free | 是 | 数据库强，认证需另外设计或使用其认证产品 | 很强，标准 Postgres | 同样需要评估境外访问 | 不如 Supabase 适合第一版注册 |
| uniCloud 阿里云免费空间 | 是 | uni-id 完整支持 | JSONL 导出；MongoDB 兼容性好 | 国内链路；但官方称稳定性在三家中最低 | 仅开发测试或改用付费按量 |
| uniCloud 支付宝云免费空间 | 是 | uni-id 完整支持 | JSONL 导出；可跨空间迁移 | 国内链路、免费额度更适合小规模用户 | **推荐试运行** |

## 免费额度与限制

### uniCloud 支付宝云

- 每个开发者有 1 个免费空间。
- 免费空间默认有效期 1 个月，需要主动续期；到期前 15 天可续。
- 免费套餐包含每月约 62 万次数据库读操作、31 万次写操作。
- 免费套餐超过任一额度会导致空间停服；不要默认开启超限扣费。
- 新创建的支付宝云内置数据库自 2026-03-25 起已切回 MongoDB，旧的 OceanBase 兼容性问题不再适用于新空间。
- 可以设置资源上限；如启用超限按量，需要保证金和余额。

### uniCloud 阿里云

- 每个账号有 1 个免费空间，默认 1 个月，需要主动续期。
- 免费套餐数据库容量 2GB，但每日只有约 500 RU 读、300 WU 写。
- 对真实注册用户来说，每日读写额度偏低，登录、刷新个人资料和读取收藏可能很快触顶。
- 阿里云原生 MongoDB 兼容性最好，但 DCloud 官方比较中将其稳定性列为三家最低。
- 如果使用阿里云，建议在公开注册前转为基础版或按量计费，并设置监控告警。

### Supabase Free

- 0 美元/月，最多 2 个活跃项目。
- 50,000 月活用户、500MB 数据库、1GB 文件存储。
- 1 周无活动会暂停；超过 500MB 数据库会进入只读。
- 免费版没有托管自动备份，需要自己定期运行 `supabase db dump`。
- 数据库是标准 Postgres，可导出业务表、用户表和密码哈希；迁移能力最好。
- 可选亚洲区域包括东京、首尔和新加坡，没有中国大陆区域。实际国内访问速度必须用真实网络测试后才能判断。

## 数据不丢失规则

无论最终选择哪一家，用户数据必须遵守以下规则：

1. 为每个用户生成应用自己的 `dailyflora_user_id`（UUID），不要让供应商 `_id` 成为跨系统唯一身份。
2. 登录账户表与业务资料表分开；花束收藏、偏好、订阅状态只关联 `dailyflora_user_id`。
3. 保存 `auth_provider` 和 `auth_provider_user_id` 映射，允许未来更换认证提供商。
4. 每周导出一次用户资料和业务表；开放注册后的前 30 天建议每日导出。
5. uniCloud 导出使用 JSONL；迁移时不要使用会丢失类型信息的 CSV。
6. 导出文件不得提交进公开 GitHub 仓库；应放入加密本地备份或私有对象存储。
7. 上线前执行一次“导出 → 空数据库恢复”演练，只有恢复成功才允许正式收集用户。
8. 密码永远不由 DailyFlora 明文保存。跨认证系统迁移时使用官方密码哈希迁移或首次登录升级方案。

## 推荐实施顺序

### 阶段 A：现在

1. 在 HBuilderX 中选择支付宝云，创建免费 uniCloud 服务空间。
2. 不启用自动超限扣费。
3. 开启到期、数据库限流和资源用量告警。
4. 安装并配置 uni-id-pages / uni-id-co。
5. 第一版仅开放“邮箱验证码”或“用户名 + 密码”其中一种，避免同时接短信、微信、Apple 登录。

### 阶段 B：内部测试

1. 建立 `dailyflora-user-profiles`、`dailyflora-favorites` 和认证身份映射。
2. 用测试账号跑通注册、登录、退出、注销、收藏和恢复。
3. 验证 Vercel 当前网页如何与 uniCloud 账户体系连接；如果必须大量改写现有 Vite 页面，应在真正开放前完成 HBuilderX / uni-app Web 入口的取舍。
4. 完成首次 JSONL 导出和恢复演练。

### 阶段 C：开放真实用户前

1. 确认免费空间续期与停服策略。
2. 根据测试用量决定继续免费、升级 4.5 元/月基础版，或开启有上限的按量计费。
3. 补齐用户协议、隐私政策、注销账户和数据删除流程。
4. 在国内移动网络、家庭宽带和公司网络分别测试注册成功率与响应时间。

## 备选触发条件

出现以下情况时，改选 Supabase：

- 决定长期保持当前 Vite + Vercel Web 架构，不再近期迁入 HBuilderX / uni-app；
- 主要用户在境外；
- 明确需要关系型查询和标准 SQL；
- 将来迁移到自建 Postgres 比迁入 uni-id 更重要。

出现以下情况时，升级 uniCloud 付费空间：

- 开始接受真实用户且不能承受忘记续期造成停服；
- 免费读写额度接近上限；
- 需要 SLA、更多日志、备份或更高稳定性；
- 需要短信、一键登录、更多云存储或正式域名能力。

## 官方资料

- uniCloud 价格与云厂商差异：https://doc.dcloud.net.cn/uniCloud/price
- uniCloud 数据导出、备份与恢复：https://doc.dcloud.net.cn/uniCloud/hellodb.html
- uni-id / 用户迁移：https://doc.dcloud.net.cn/uniCloud/uni-id/summary.html
- uni-id-pages：https://doc.dcloud.net.cn/uniCloud/uni-id-pages.html
- GitHub Pages 静态托管说明：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Vercel Postgres / Marketplace：https://vercel.com/docs/postgres
- Vercel Storage Marketplace：https://vercel.com/docs/storage
- Supabase 免费额度：https://supabase.com/pricing
- Supabase 数据备份：https://supabase.com/docs/guides/platform/backups
- Supabase 用户导出：https://supabase.com/docs/guides/auth/managing-user-data
- Supabase 可用区域：https://supabase.com/docs/guides/platform/regions
