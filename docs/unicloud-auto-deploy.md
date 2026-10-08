# UniCloud 自动发布

目标：向 `codex/dailyflora-integration` 推送一次，GitHub Actions 自动构建并上传支付宝云空间 `env-00jy6xjkcayy`。GitHub 保留源代码；UniCloud 提供网站。上传和构建本身不调用 AI 模型。

## 一次性设置

在 https://github.com/calfnai/dailyFlora/settings/secrets/actions 添加：

- `HBUILDERX_USERNAME`：拥有该空间权限的 DCloud 账号。
- `HBUILDERX_PASSWORD`：该账号密码。只填 GitHub Secrets，不发到聊天、不写进源码。

PR 检查只构建、不读取密码。合并提交标题必须以 `[DF-YYYYMMDD-HHmm]` 开头，使用上海时间。合并并推送集成分支后才触发生产上传；没有手工本地生产上传入口。

## 实现和验证边界

- 使用固定官方 HBuilderX 5.26.2026091802 Linux CLI；安装包约 1.78 GB，首次下载会较慢。
- 本机同版本 CLI 已实测上传测试文件，并从云端 HTTPS 读回。
- Linux runner 登录和完整自动发布仍须在配置 Secrets 后实际验收，不能据本机测试宣称跑通。
- 上传前验证干净构建、完整 SHA 和分支；剔除 server、source maps、隐藏文件及 GitHub Pages CNAME。
- 上传成功后校验托管域名 version.json 的完整 SHA 和发布标签。DNS、自定义域名证书、注册登录和手控速度是独立验收项。
- 不删除旧资源，避免旧页面引用的资源立即失效。上传不是原子切换；失败时查看 Actions 日志，不将部分上传称为成功，也不盲目回滚。
- 云函数不随此流程上传。证书续期也不在此流程内。
- GitHub Actions 用量和 UniCloud 流量仍受各平台套餐约束；不是 AI token 消耗。
