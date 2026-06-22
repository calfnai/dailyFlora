# DailyFlora Codex 接入与美感来源维护

最后更新：2026-06-22

这份文档用于在另一台电脑上接入 DailyFlora，并让新的 Codex 线程继续维护美感来源。

## 另一台电脑接入项目

1. 安装基础工具：
   - Git
   - Node.js 20 或更新版本
   - Codex 桌面应用或可用的 Codex 环境

2. 登录 GitHub：
   - 确认当前电脑可以访问 `calfnai/dailyFlora`。
   - 如果使用命令行，可先执行 `gh auth login` 登录 GitHub CLI。

3. 拉取项目：

```bash
git clone https://github.com/calfnai/dailyFlora.git
cd dailyFlora
npm install
```

如果这台电脑已经有项目文件夹：

```bash
cd dailyFlora
git pull --ff-only
npm install
```

4. 本机看花：

```bash
npm run dev
```

然后打开终端里显示的本机地址，通常是：

```text
http://localhost:5173/
```

线上版本地址：

```text
https://calfnai.github.io/dailyFlora/
```

## 在 Codex 中继续这个项目

在另一台电脑上，用 Codex 打开 `dailyFlora` 文件夹，然后给 Codex 这段提示：

```text
这是 DailyFlora 项目。请先阅读 docs/aesthetic-rating-board.md 和 docs/codex-aesthetic-handoff.md。
维护美感来源时，只更新评分板和灵感库，不要直接改变生成规则。
所有新审美来源先进入评分，不自动采纳。
国外花艺网站不能作为默认审美来源；中国当代花艺和小红书语境优先。
```

如果只是整理美感来源，不需要运行构建，也不需要改 `src/`。

如果要把评分结果转成花束生成效果，才允许修改：

- `src/themes.ts`
- `src/spec.ts`
- `src/bouquetScene.ts`
- `src/quality.ts`
- `src/main.ts`

修改生成效果后必须运行：

```bash
npm run build
```

## 美感来源放在哪里

主要文件：

```text
docs/aesthetic-rating-board.md
```

这个文件记录：

- 可评分来源
- 负样本
- 中国语境规则
- 哪些来源只能当结构参考
- 所有者评分和备注

不要把小红书或其他平台的原图复制进项目，也不要把原图部署到网页里。只记录链接、观察和可转成 3D 粒子花束的抽象参数。

## 新增来源的格式

新增来源先放在评分板里，建议格式：

```markdown
| C01 | [来源名称](https://example.com) | 候选：中文当代花艺/花店/公开图文 | 待评分 |  |
```

评分后再补：

```markdown
| C01 | [来源名称](https://example.com) | 可用：小花密度、色彩层次、360 体积感 | +2 | cn-fit, dense, airy |
```

## 当前审美硬规则

- 中国当代花艺语境优先。
- 小红书用户主动提供的链接优先。
- 日本审美只允许部分参考，标注 `jp-partial`。
- 欧美 wedding florist、garden style florist、bridal bouquet、market bouquet、Pinterest 风国外花艺不能作为默认审美来源。
- 国外资料最多用于结构/技法，不用于色彩、潮流、氛围和“好不好看”的判断。
- 新来源没有所有者确认，不进入生成器。

## 发布到 GitHub

如果只更新美感文档：

```bash
git status -sb
git add docs/aesthetic-rating-board.md docs/codex-aesthetic-handoff.md
git commit -m "Update aesthetic sources"
git push
```

如果修改了网页生成效果，还要构建并部署 GitHub Pages。当前项目使用 `gh-pages` 分支发布静态 `dist` 文件，交给 Codex 操作更稳。

给 Codex 的发布提示：

```text
请只发布本次相关文件。若只是美感文档，只更新 main，不要部署 gh-pages。
若修改了网页生成效果，请运行 npm run build，并把 dist 发布到 gh-pages。
不要把无关的本地草稿或 inbox 文件带进提交。
```
