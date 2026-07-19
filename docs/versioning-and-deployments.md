# DailyFlora 版本与部署标识规则

从 2026-07-20 起，版本讨论不再使用“上一版”“上上版”“刚才那版”等相对说法。

## 统一版本号

正式版本格式：

```text
DF-YYYYMMDD-HHmm-<8 位 Git SHA>
```

示例：

```text
DF-20260720-0135-d16bb89
```

时间采用 `Asia/Shanghai`。最后八位来自不可变的 Git commit SHA，因此即使同一分钟内有多次提交，也不会混淆。

## 在哪里查看

| 位置 | 可用标识 |
| --- | --- |
| 正式网页右下角 | 完整 DailyFlora 版本号 |
| `/version.json` | 完整 SHA、分支、构建时间、Vercel Deployment ID 和 URL |
| GitHub commit | 完整 SHA、提交时间、`[DF-YYYYMMDD-HHmm]` 提交标题 |
| Vercel Deployment | Deployment ID、Git SHA、构建时间和唯一部署 URL |

## 回退规则

任何回退操作必须明确提供以下至少一种标识：

1. 完整 Git SHA；
2. 完整 DailyFlora 版本号；
3. Vercel Deployment ID，例如 `dpl_...`；
4. 唯一 Vercel Deployment URL。

收到“回到上一版”之类的要求时，执行者必须先列出候选版本及其精确标识，让用户确认后才能回退。

## 多对话协作规则

每个开发对话使用独立 worktree 和分支。开发完成后 PR 目标统一为 `codex/dailyflora-integration`。Vercel Preview 用于查看各分支，正式站只由整合分支更新。
