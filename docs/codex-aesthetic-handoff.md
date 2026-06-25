# DailyFlora Codex 接入与美感来源维护

最后更新：2026-06-25

这份文档用于在另一台电脑上接入 DailyFlora，并让新的 Codex 线程继续维护美感来源、版本进度和生成规则。

## 当前项目状态快照

- 当前 npm 版本：`0.12.8`
- 当前产品层标记：`0.12E`
- 当前主要开发分支：`codex/low-poly-petal-flowers`
- 线上入口：<https://calfnai.github.io/dailyFlora/>
- 线上参考图库：<https://calfnai.github.io/dailyFlora/docs/dailyflora-reference-gallery.html>
- 本地参考图库：`docs/dailyflora-reference-gallery.html`
- 花材识别文档：`docs/reference-flower-identification.md`
- 花型计划样例页：`docs/dailyflora-flower-plan-samples.html`
- 花材形态实验页：`docs/primitive-lab.html`
- 版本提要：`CHANGELOG.md`

另一台机器的 Codex 必须先读：

1. `docs/codex-aesthetic-handoff.md`
2. `CHANGELOG.md`
3. `docs/dailyflora-reference-gallery.html`
4. `docs/reference-flower-identification.md`
5. `src/flowerPlans.ts`
6. `src/bouquetScene.ts`
7. `src/floraPrimitives.ts`
8. `docs/primitive-lab.html`

不要只看代码。这个项目的生成判断依赖用户连续纠正过的审美规则。

## 2026-06-25 已确认规则

- 用户输入的参考图和文字优先于 Lobster、搜索结果和任何外部默认审美。
- 暂停直接使用 Lobster 作为默认 handoff；除非用户明确要求，不要重新启用 Lobster 流程。
- 不要直接浏览小红书。只使用用户给出的链接、截图、本地图片、手动下载后的资料。
- 不要在没有用户确认的情况下改变生成规则。
- 版本必须连续记录；当前线索从 `0.1`、`0.11`、`0.12.0` 到 `0.12.5`。
- 每次重大改动必须更新 `CHANGELOG.md`。

## 当前渲染层级定义

- `省`：低面数球形/花球底模。
- `清`：光滑球形，80% 透明度。不要再用 5 瓣小花。
- `精`：唯一尝试明确花型差异的模式。必须通过 `flowerPlan` 先声明花型，再生成模型。

用户已经明确反馈：5 瓣小花很丑，不应该作为 `清` 的表现。

## 当前交互规则

- 日历按钮：打开日期选择器，位置必须贴近日历按钮，不能跑出浏览器可触控范围。
- 选完日期后：日期选择器应自动关闭或失焦。
- random 日期按钮：随机跳到某一天对应的花束页面。
- 圆形 reverse 按钮：只反转当前镜头路线。
- 星形/预设按钮：随机生成新的镜头路线预设。
- 自动隐藏 UI 上的按钮必须有清楚的人话提示。

## 当前审美判断

从参考图库和图像识别中提炼出的花材/形态角色：

- 盘状花：洋甘菊、雏菊、非洲菊/太阳花感的大花盘。
- 层叠圆花：玫瑰、洋桔梗、花毛茛、山茶/牡丹/乒乓菊类。
- 穗状花：飞燕草/翠雀、狐尾百合、金鱼草、风信子、蛇鞭菊类。
- 开口雕塑花：蝴蝶兰、洋水仙、马蹄莲、郁金香/百合类。
- 球簇花：绣球、小球菊、密集小花团。
- 果材：浆果、风铃果、小圆果点。
- 空气填充：满天星、米花、蜡梅感小点、细枝、藤线、蕨叶/草叶。

生成器不应该只知道“好看/不好看”，而要知道每束花里有哪些花型角色、占比、位置和避免项。

2026-06-25 进一步确认：花材识别不是主要错误，主要错误是 flowerPlan 没有变成可读的 Three.js 形态语法。下一阶段不要继续增加花名，先验收 primitive lab：隐藏标签后，单个形态应能在几秒内区分出盘状、层叠、穗状、开口雕塑、簇花、果材和空气填充。

2026-06-25 二次确认：primitive lab 仍不能算通过。不要进入 composition-lab，直到七个 primitive 在标签隐藏状态下能独立通过 3 秒识别。源码必须同步到 main，不能只把压缩后的 `gh-pages` 产物当作交付物。

## 当前决定性文件

- `src/bouquetScene.ts`：最终 Three.js 花束形态和材质，决定视觉结果。
- `src/floraPrimitives.ts`：可复用花材 primitive，后续应逐步替换 `精` 渲染里的匿名几何。
- `src/flowerPlans.ts`：生成前花型计划，决定 `精` 模式尝试哪些花材角色。
- `src/spec.ts`：每天的 seed、主题和 flowerPlan 生成入口。
- `src/main.ts`：UI、日期、random、镜头路线、HUD 文案。
- `src/styles.css`：UI、提示、HUD、日期选择器位置相关样式。
- `src/types.ts`：flowerPlan 和 bouquet spec 类型契约。
- `docs/reference-flower-identification.md`：参考图库花材识别和生成含义。

## 重要纠错记录

- `0.12.0` 曾经把花束主体形态改坏：花头和绿色植物过度分批/发散，破坏整体轮廓。
- `0.12.1` 回退了错误主体形态，并加了按钮提示。
- `0.12.2` 纠正了日期选择器、reverse/random 镜头语义、以及省/清/精层级。
- `0.12.3` 增加了 flowerPlan 层，让 `精` 有生成前计划。
- `0.12.4` 增加参考花材识别，并把 `清` 改成 80% 透明光滑球。
- `0.12.5` 将参考图库和图片公开发布到 GitHub Pages。
- `0.12.7` 增加 primitive lab，先测试单个花材形态，再回接整束花。
- `0.12.8` 加强 primitive 形态指纹，并给 lab 增加隔离、视角、轮廓、网格和性能统计。

下一台机器继续开发时，不要重复 `0.12.0` 的错误：不要为了“更多花型”破坏花束整体轮廓。

## 多机器同步工作流

另一台机器开始前：

```bash
git clone https://github.com/calfnai/dailyFlora.git
cd dailyFlora
git fetch origin
git checkout codex/low-poly-petal-flowers
npm install
```

如果仓库默认分支没有最新开发内容，优先使用：

```bash
git fetch origin codex/low-poly-petal-flowers
git checkout codex/low-poly-petal-flowers
```

然后启动本地预览：

```bash
npm run dev
```

每轮开发结束必须同步：

- 代码文件。
- `CHANGELOG.md`。
- 本 handoff 文档。
- 如果改了参考或审美判断，也同步 `docs/reference-flower-identification.md`、`src/flowerPlans.ts`。

发布网页：

```bash
npm run deploy:pages
```

发布完成后检查：

```bash
curl -I https://calfnai.github.io/dailyFlora/
curl -I https://calfnai.github.io/dailyFlora/docs/dailyflora-reference-gallery.html
```

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
