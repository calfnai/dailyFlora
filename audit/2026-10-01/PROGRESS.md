# DailyFlora 2026-10-01 修复与远程验收进度

状态：进行中，尚未发布独立前端入口，不可作为完整验收报告。

- 工作树：`/Users/ziqing/.codex/worktrees/dailyflora-oct01-fixes/dailyFlora`
- 分支：`codex/dailyflora-oct01-fixes`
- 基线 SHA：`1715c4a54f223ca6df6d8bc5f9e64d7f87e8cb7e`；当前修复尚未提交。
- 新空间：支付宝云 `daily-fora` / `env-00jy6xjkcayy`。
- 已上传 beta API 与 10 个 beta 集合 schema；健康版本 `0.74.0-20261001`。
- 实际 API：`https://env-00jy6xjkcayy.dev-hz.cloudbasefunction.cn/dailyflora-api-beta`。
- 7 项真实云端基础测试结果见同目录 JSON。测试账号凭据仅保存在忽略的 `.codex/runtime/remote-accounts.json`，不得发布。
- 构建 `npm run build:vercel` 已通过。回归测试与 TypeScript 检查通过；这些不是浏览器/真实云数据库事务验收的替代。

## 已改代码

昵称安全渲染、登录回跳约束、游客收藏衔接、新旧空间浏览器存储隔离、手机导航、会员刷新/分页/上传反馈、公开花束渲染参数、私有名称隔离、管理员检索/分页/取消退款、人工积分金额与付款流水号、角色授权、重置密码撤销会话、任务幂等预留、扣分/完成/退款事务及重复请求保护。

## 尚待完成和验证

1. HBuilderX 首次登录已成功。CLI `--run cloudfunction` 输出明确是本地调试，不能视为云端运行；`--cloud` 未改变此行为。初始化管理员必须使用实际云端管理调用，不得扩大 HTTP 权限。
2. 云存储私有目录创建已提交，桌面接口随后失去窗口。必须核实目录存在、私有权限生效并验证匿名不可读。
3. 真实云端管理员操作、并发提交、扣分、完成、失败退款、删除公开链接验收。
4. 完全云端的图片生成处理器尚未接通；当前管理端仍引用本机 worker，不符合用户最终要求。不能宣称完整生成流程可用。
5. 云端没有 DirectMail 环境变量，找回密码实际邮件发送未通过；不要虚构成功。
6. 30 天图片清理、管理端详情/审计、翻译与所有页面视觉验收仍未完成。
7. 今日独立前端未发布；目标路径为 `/releases/2026-10-01/`，此时不能当作可用链接。必须通过 integration 分支 GitHub push 触发发布，保留现有站点根入口。
8. 最后密码重置事务修正仍只在源代码中，需重新 prepare 并上传云函数。

## 阻塞

Chrome 和 HBuilderX 的 Computer Use 接口先后返回 `cgWindowNotFound`，随后窗口枚举超时并重置内核。需恢复已解锁桌面和打开的应用后继续 UI 操作。没有遇到新的登录失效证据，勿要求重复登录。
