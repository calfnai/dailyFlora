# GitHub Sync Runbook

最后更新：2026-06-24

## 问题定义

DailyFlora 的 GitHub 同步失败，不是仓库本身不能同步，而是本机缺少稳定、持久的 GitHub 写入通道。

已确认：

- 仓库 remote 正确：`https://github.com/calfnai/dailyFlora.git`
- GitHub API 可访问。
- 当前机器没有全局 `gh`。
- Homebrew 可用，但 `HOMEBREW_NO_AUTO_UPDATE=1 brew install gh` 在本机下载阶段会卡住，不能作为可靠方案。
- 之前成功发布依赖过 `/tmp/dailyflora-gh/.../gh` 临时工具；新对话不会稳定继承这个路径。

## 一劳永逸方案

### 1. 系统级安装 GitHub CLI

不要依赖 Codex 临时下载，也不要依赖本机 Homebrew 安装。

推荐做法：

1. 用浏览器打开 GitHub CLI 官方安装页。
2. 下载 macOS installer/pkg。
3. 安装完成后，在终端确认：

```bash
gh --version
```

目标状态：任意新终端、任意 Codex 新对话都能执行 `gh --version`。

### 2. 登录 GitHub 并写入系统凭据

```bash
gh auth login --hostname github.com --web --git-protocol https
gh auth setup-git
gh auth status
```

目标状态：

- `gh auth status` 显示已登录 `calfnai`
- Git 协议为 HTTPS
- Git 凭据写入 macOS Keychain

### 3. 以后发布只用项目命令

完整同步源码清单和 GitHub Pages：

```bash
npm run deploy:github
```

只更新线上 GitHub Pages：

```bash
npm run deploy:pages
```

首次机器登录：

```bash
npm run github:login
```

## 新对话判断规则

新 Codex 对话遇到“不能同步”时，先执行：

```bash
gh --version
gh auth status
git remote -v
npm run deploy:github -- --dry-run --skip-build
```

如果 `gh` 不存在，结论不是“仓库不能同步”，而是“本机未完成系统级 GitHub CLI 安装”。

如果 `gh auth status` 未登录，结论不是“仓库不能同步”，而是“需要执行 `npm run github:login` 或 `gh auth login`”。

如果工作区很脏，不要 `git add -A`。项目默认发布脚本会按 `scripts/deploy-source-files.json` 同步清单文件，避免误推草稿。

## 不推荐路径

- 不推荐依赖 `/tmp/dailyflora-gh/...`：临时路径会失效。
- 不推荐让每个新对话重新下载 GitHub CLI：网络不稳定时会卡住。
- 不推荐 Homebrew 安装 `gh`：本机已观察到下载阶段卡住。
- 不推荐直接 `git add -A && git push`：当前项目存在大量草稿、附件和实验文件，容易误推。

## 长期目标状态

做到以下三点后，新对话不应该再说“不能同步到 GitHub”：

1. `gh --version` 在系统 PATH 中可用。
2. `gh auth status` 显示已登录 `calfnai`。
3. 使用 `npm run deploy:github` 或 `npm run deploy:pages` 发布。
