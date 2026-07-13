# DailyFlora Codex Skill

最后更新：2026-07-13

这是项目内 skill。新的 Codex 线程接手 DailyFlora 时，应先按这份文件执行，再决定是否改代码。

## 触发场景

当用户提出以下任何请求时，使用本 skill：

- 修改 DailyFlora 花束视觉。
- 解释或更新审美复盘 dashboard。
- 维护参考图库、花库、花束库。
- 新增主题、花束计划、primitive 或 composition 规则。
- 发布 GitHub Pages。
- 处理用户对审美、叶材、花材、镜头、UI 的批评。
- 调整 MVP 路由、开发组目录、用户页测试、临时后台和固定样例库。

## 必读文件

开始工作前按顺序阅读：

1. `docs/dailyflora-aesthetic-system-0.13.md`
2. `docs/codex-aesthetic-handoff.md`
3. `CHANGELOG.md`
4. `data/aesthetic-review-dashboard.json`
5. `docs/aesthetic-review-dashboard.html`
6. `docs/dailyflora-reference-gallery.html`
7. `docs/primitive-lab.html`
8. `src/floraPrimitives.ts`
9. `src/flowerPlans.ts`
10. `src/bouquetScene.ts`

如果用户明确在讲 UI，再读：

- `index.html`
- `src/main.ts`
- `src/styles.css`

如果用户明确在讲部署，再读：

- `scripts/deploy-github-pages.mjs`
- `scripts/deploy-source-files.json`
- `docs/github-sync-runbook.md`

## 核心工作原则

- 不要只说“我理解了”。必须把理解写到 dashboard、handoff 或 aesthetic system 文档里。
- 不要把 Codex 的审美判断当成用户验收。
- 用户文字和用户给过的参考图优先于外部搜索、Lobster、国外花艺资料。
- 不要默认启用 Lobster，不要直接浏览小红书。
- 不要为了增加复杂度破坏整体轮廓。
- 先判断问题属于 primitive、composition、palette、camera/UI 还是 deploy。
- 小改也要尽量留下可读版本记录。

## 审美判断速记

目标方向：

- 中国当代花艺和小红书语境。
- 有整体，也有局部细节。
- 小花矩阵、低位簇花、外开线条、果点、绿色空气感。
- 色彩可以高饱和，但要用绿色、浅色和空气距离缓冲。
- 360 度旋转成立，默认镜头能看清整束。

当前最好 composition 启发：

- 山岗小花：小花矩阵、低位簇花、穗状花穿插、线条外开。
- 0.14 通过基线：晨露莓园、夏日风车、梦幻紫、洋水仙季节、会呼吸的风景、狐尾百合、浆果森林、秋日果汁、荔枝花园彩虹和反向边界。

明确避开：

- 欧美婚礼花艺。
- 粗糙市场束。
- 单一大主花。
- 全花无叶的油腻画面。
- 叶材乱飞、挡花、抢戏。
- 穗状花成片堆顶或统一向内聚拢。

## 修改视觉的流程

1. 复述问题属于哪一层：primitive、composition、palette、camera/UI、deploy。
2. 查当前实现，不凭记忆改。
3. 若是 primitive 问题，先改 `src/floraPrimitives.ts` 和 `src/primitiveLab.ts`，不要直接在整束里硬补。
4. 若是 composition 问题，优先改 `src/flowerPlans.ts` 和 `src/bouquetScene.ts` 的放置、朝向、比例、层次。
5. 若是 palette 问题，优先改 `src/themes.ts` 或 plan 专属 palette 映射。
6. 若是 camera/UI 问题，改 `src/main.ts`、`src/styles.css`、`index.html`。
7. 更新 `CHANGELOG.md`。
8. 需要继承的审美结论更新 `docs/codex-aesthetic-handoff.md` 和 `docs/dailyflora-aesthetic-system-0.13.md`。
9. 涉及审美复盘状态时更新 `data/aesthetic-review-dashboard.json`。
10. 运行 `npm run build`。

## 花库门禁

0.13 继承 16 类 Primitive Lab。用户已确认花库达到及格线，但这不是最终完美。`CosmosOpenFlower / 波斯菊/小面花型` 是从山岗小花和热带丛林经验中补登记的第 16 类，后续不能再把它藏在盘状花或 chamomile 下面。

后续如果用户说某个花材又不像了：

- 不要争辩。
- 不要批量重做全部花库。
- 只改被指出的类。
- 在 Primitive Lab 显示用户验收状态。
- 未经用户确认，不要写成 pass。

如果代码、flowerPlan 或主花束里已经出现某类稳定可复用形态，必须同步登记到 TARGET SHAPE VOCABULARY；这是花材库管理员视角的职责。

## 叶材门禁

叶材不是装饰，也不是物理支架。

它必须：

- 从花束结构里合理冒出来。
- 托住花间空气。
- 拉开空间和边缘节奏。
- 缓冲高饱和花色。

它不能：

- 挡主花。
- 飞到不合理位置。
- 在空中表现成根部草束。
- 比花抢戏。

## Dashboard 规则

审美复盘 dashboard 同时服务两类读者：用户用它验收，Codex 用它在动手前主动恢复项目审美记忆。它不是只给用户看的展示页，也不能等用户指出整体形态问题后才补看。

以下改动开始前必须先回看 dashboard：

- 主花束 composition 与整体外轮廓。
- 花材比例、密度、层次与叶材关系。
- 新 primitive 接入 flowerPlan 或主 renderer。
- 可能改变远看轮廓、空气感、物理生长关系或花材丰富度的视觉修改。

回看时至少核对：通过基线、可复用审美规则、日期花束回炉记录和反向样本。提交前再检查中心密球、全花无叶、统一角度、半空花材、单一大主花和花材丰富度不足是否复发。

dashboard 必须能回答：

- 参考图被读成了什么？
- 为什么采纳？
- 为什么拒绝？
- 对应哪些 primitive？
- 当前实现差在哪里？
- 下一步改 primitive、composition、palette 还是 camera/UI？

debug 入口：

```text
https://calfnai.github.io/dailyFlora/?debug=1
```

不要让审美图片页、花库罗列、花束库入口消失。部署后必须检查这些链接。

## 发布流程

常规发布：

```bash
npm run build
node scripts/deploy-github-pages.mjs --skip-build
```

发布后检查：

```bash
curl -I https://calfnai.github.io/dailyFlora/
curl -I https://calfnai.github.io/dailyFlora/docs/aesthetic-review-dashboard.html
curl -I https://calfnai.github.io/dailyFlora/docs/dailyflora-reference-gallery.html
curl -I https://calfnai.github.io/dailyFlora/docs/primitive-lab.html
curl -I https://calfnai.github.io/dailyFlora/docs/dailyflora-flower-plan-samples.html
```

注意：

- 不要占用用户正在使用的 `5174` 端口。
- 发布脚本不能用原始 HTML 覆盖 Vite 编译后的 dashboard 和 Primitive Lab。
- `scripts/deploy-source-files.json` 是 main 分支源码发布清单；新增关键文档必须加入。

## 失败处理

如果用户指出“越改越差”：

1. 先承认问题层级，不要辩解。
2. 查 git/history 或当前实现，找出是回归、过度修正还是理解偏差。
3. 把用户逐项反馈写成可执行状态。
4. 分项修，不批量凭感觉重做。
5. 未经用户确认，不标记通过。

如果页面“只剩字”或模型不显示：

- 先检查部署后的 HTML 是否引用 `assets/*.js`。
- 检查是否被原始 HTML 覆盖。
- 检查 GitHub Pages 上资源是否 200。
- 检查图片路径，尤其是中文、空格和 emoji 文件名。

## 交付格式

完成后告诉用户：

- 改了什么。
- 版本号。
- 构建是否通过。
- 发布地址。
- 如果发布了 GitHub，给出 main 和 gh-pages commit。

不要把所有终端输出倒给用户，只说关键结果。
