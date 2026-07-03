# DailyFlora 开发过程复盘材料

生成时间：2026-06-26
用途：交给另一位 AI 审视 DailyFlora 从零到当前状态的开发过程，重点挑出 Codex 在判断、执行、沟通、审美理解、版本管理上的问题。

## 0. 证据边界

这份复盘基于当前仓库能查到的证据整理：

- Git 提交记录。
- `CHANGELOG.md`。
- `docs/codex-aesthetic-handoff.md`。
- `docs/aesthetic-rating-board.md`。
- `data/aesthetic-review-dashboard.json`。
- 当前用户在本轮明确要求补记的内容：发火节点、分身思考、用户用 ChatGPT 网页版给 Codex 的输入。

重要限制：

- 当前仓库没有完整原始聊天记录。
- 我无法从本地文件还原每一次用户发火的原话、具体时间和上下文。
- “ChatGPT 网页版输入”的原文没有完整落在仓库里；目前只能记录它曾经参与开发判断，具体内容需要用户补充或从浏览器/聊天记录另行导出。
- 所以下面会把内容分为“有文件/提交证据支持”和“需要补充原话/上下文”。
- 下面的 GitHub commit 链接分两类：已在远端分支上的 commit 可直接打开；本地分支独有 commit 目前只有哈希，必须先同步到 GitHub 后，精确 commit 链接才一定可打开。

## 0.1 每阶段结果与代码入口

主仓库：

- GitHub 仓库：<https://github.com/calfnai/dailyFlora>
- 线上结果：<https://calfnai.github.io/dailyFlora/>
- 当前 GitHub 主线源码：<https://github.com/calfnai/dailyFlora/tree/main>
- 当前 GitHub Pages 产物分支：<https://github.com/calfnai/dailyFlora/tree/gh-pages>

阶段入口表：

| 阶段 | 结果/证据 | GitHub / 代码入口 |
| --- | --- | --- |
| 0.1 初始屏保 | 从零实现 DailyFlora screensaver | [初始化提交 eae7851](https://github.com/calfnai/dailyFlora/commit/eae785175282d12db44fa6a06673845b98db286d), [screensaver 提交 a738382](https://github.com/calfnai/dailyFlora/commit/a738382f92645a323abf25cea76b86296c3b4351), [入口文件](https://github.com/calfnai/dailyFlora/blob/main/index.html), [主程序](https://github.com/calfnai/dailyFlora/blob/main/src/main.ts), [Three.js 花束场景](https://github.com/calfnai/dailyFlora/blob/main/src/bouquetScene.ts) |
| 1.2 早期调参 | 构图、密度、渲染、镜头路线 | [构图控制提交 8cf7cf4](https://github.com/calfnai/dailyFlora/commit/8cf7cf406a55f2b3acd82d6342135bee0445fda1), [密度/渲染拆分 5009813](https://github.com/calfnai/dailyFlora/commit/5009813086ac04b792066bea4f32598266fae39f), [镜头路线 a5f0c83](https://github.com/calfnai/dailyFlora/commit/a5f0c8383dcbd843cdbfccc29cb191b498031d73), [main.ts](https://github.com/calfnai/dailyFlora/blob/main/src/main.ts), [quality.ts](https://github.com/calfnai/dailyFlora/blob/main/src/quality.ts) |
| 2 国外审美误判 | 国外花艺资料被降级为负样本/结构参考 | [审美 handoff 提交 73c9a96](https://github.com/calfnai/dailyFlora/commit/73c9a96082e42460708cdfeed23b8ca8b82d3033), [美学评分看板](https://github.com/calfnai/dailyFlora/blob/main/docs/aesthetic-rating-board.md) |
| 3 小红书/Lobster/外部 AI | 从默认外搜改成用户给源、Lobster fallback | [inspiration workflow](https://github.com/calfnai/dailyFlora/blob/main/docs/inspiration-workflow.md), [Lobster 任务脚本](https://github.com/calfnai/dailyFlora/blob/main/scripts/lobster-xhs-plan.mjs), [inbox 说明](https://github.com/calfnai/dailyFlora/blob/main/data/inbox/README.md), [README 规则](https://github.com/calfnai/dailyFlora/blob/main/README.md) |
| 4 参考图库 | 用户参考图、reference deck、低面数花瓣参考 | [reference deck d194fe0](https://github.com/calfnai/dailyFlora/commit/d194fe0487e15c8a0bd7af1e92bbb036b28403f3), [reference deck json eceaad2](https://github.com/calfnai/dailyFlora/commit/eceaad29e940e8207d6667e862ca29c80839b229), [reference deck link c0e6e8a](https://github.com/calfnai/dailyFlora/commit/c0e6e8a9b4c195343bbb3c07e3144206d9752cc4), [inspiration library](https://github.com/calfnai/dailyFlora/blob/main/data/inspiration-library.json) |
| 5 0.12.0 视觉回归 | 主体形态变复杂但轮廓被破坏 | 本地提交 `7e58fb8`, `431a885`, `41a9939`, `29b844f` 目前不在远端分支；审查当前结果先看 [CHANGELOG](https://github.com/calfnai/dailyFlora/blob/main/CHANGELOG.md), [bouquetScene.ts](https://github.com/calfnai/dailyFlora/blob/main/src/bouquetScene.ts), [styles.css](https://github.com/calfnai/dailyFlora/blob/main/src/styles.css) |
| 6 0.12.1-0.12.4 纠错 | 修轮廓、修交互、修 `清`、加 flower identification | 本地提交 `29b844f`, `11b09a0`, `84a3d6e`, `3ca3cf1` 目前不在远端分支；审查当前代码看 [flowerPlans.ts](https://github.com/calfnai/dailyFlora/blob/main/src/flowerPlans.ts), [spec.ts](https://github.com/calfnai/dailyFlora/blob/main/src/spec.ts), [bouquetScene.ts](https://github.com/calfnai/dailyFlora/blob/main/src/bouquetScene.ts) |
| 7 FlowerPlan | 高精模式先声明花型计划，再生成 | 本地提交 `84a3d6e`, `3fa79e1`, `840200e` 目前不在远端分支；审查当前代码看 [flowerPlans.ts](https://github.com/calfnai/dailyFlora/blob/main/src/flowerPlans.ts), [types.ts](https://github.com/calfnai/dailyFlora/blob/main/src/types.ts)。样例页 `docs/dailyflora-flower-plan-samples.html` 当前是本地文件，需同步后才有稳定 GitHub 链接。 |
| 8 Primitive Lab / 分身复盘 | 单个花材形态实验页、四角色 dashboard 门禁 | [maintainable primitive lab 提交 a159eea](https://github.com/calfnai/dailyFlora/commit/a159eeaff432ff025cca14aee590b0d99b6153f3), [floraPrimitives.ts](https://github.com/calfnai/dailyFlora/blob/main/src/floraPrimitives.ts), [primitiveLab.ts](https://github.com/calfnai/dailyFlora/blob/main/src/primitiveLab.ts), [primitive-lab.html](https://github.com/calfnai/dailyFlora/blob/main/docs/primitive-lab.html), [aesthetic handoff](https://github.com/calfnai/dailyFlora/blob/main/docs/codex-aesthetic-handoff.md) |
| 9 7 类到 13/15 类花库 | 旧粗分类不够，扩为更细花型验收 | [floraPrimitives.ts](https://github.com/calfnai/dailyFlora/blob/main/src/floraPrimitives.ts), [primitive-lab.html](https://github.com/calfnai/dailyFlora/blob/main/docs/primitive-lab.html), [CHANGELOG](https://github.com/calfnai/dailyFlora/blob/main/CHANGELOG.md), [handoff](https://github.com/calfnai/dailyFlora/blob/main/docs/codex-aesthetic-handoff.md) |
| 10 叶材规则 | 叶材不是物理支架，而是空间感/层次/饱和度缓冲 | [aesthetic handoff](https://github.com/calfnai/dailyFlora/blob/main/docs/codex-aesthetic-handoff.md), [floraPrimitives.ts](https://github.com/calfnai/dailyFlora/blob/main/src/floraPrimitives.ts)。`data/aesthetic-review-dashboard.json` 当前是本地文件，需同步后才有稳定 GitHub 链接。 |
| 11 GitHub/多机器同步 | 区分源码、部署产物、同步流程 | [部署脚本](https://github.com/calfnai/dailyFlora/blob/main/scripts/deploy-github-pages.mjs), [部署清单](https://github.com/calfnai/dailyFlora/blob/main/scripts/deploy-source-files.json), [handoff](https://github.com/calfnai/dailyFlora/blob/main/docs/codex-aesthetic-handoff.md)。`docs/github-sync-runbook.md` 当前是本地文件，需同步后才有稳定 GitHub 链接。 |

给审查 AI 的读取顺序建议：

1. 先读 [CHANGELOG.md](https://github.com/calfnai/dailyFlora/blob/main/CHANGELOG.md) 和 [docs/codex-aesthetic-handoff.md](https://github.com/calfnai/dailyFlora/blob/main/docs/codex-aesthetic-handoff.md)，理解版本和踩坑记录。
2. 再读 [src/bouquetScene.ts](https://github.com/calfnai/dailyFlora/blob/main/src/bouquetScene.ts)、[src/floraPrimitives.ts](https://github.com/calfnai/dailyFlora/blob/main/src/floraPrimitives.ts)、[src/flowerPlans.ts](https://github.com/calfnai/dailyFlora/blob/main/src/flowerPlans.ts)，判断代码是否支撑审美目标。
3. 再读 [docs/aesthetic-rating-board.md](https://github.com/calfnai/dailyFlora/blob/main/docs/aesthetic-rating-board.md)、[docs/primitive-lab.html](https://github.com/calfnai/dailyFlora/blob/main/docs/primitive-lab.html)、[data/inspiration-library.json](https://github.com/calfnai/dailyFlora/blob/main/data/inspiration-library.json)，判断参考来源和验收机制是否可靠。
4. 最后打开 [线上 DailyFlora](https://calfnai.github.io/dailyFlora/) 和 [GitHub Pages 分支](https://github.com/calfnai/dailyFlora/tree/gh-pages)，核对交付结果和源码是否一致。

## 1. 项目从零开始的主线

### 1.1 初始阶段：DailyFlora 作为 Three.js 每日花束屏保

可见证据：

- `eae7851 Initialize DailyFlora repository`
- `a738382 Implement DailyFlora screensaver`
- `df25f39 Deploy DailyFlora site`
- `CHANGELOG.md` 中 `0.1.0 - Initial Version`

最初目标是一个纯前端 Three.js 网页：

- 每天根据日期 seed 生成确定性的花束。
- 有基础粒子花、叶子、枝条。
- 有密度控制、渲染控制、镜头运动。
- 可静态部署到 GitHub Pages。

这一阶段的核心问题：

- 视觉上只是“生成性花束”，还没有足够清晰的审美来源。
- 花的形态更多是抽象粒子和低面数形体，不像具体花材。
- Codex 主要按通用生成艺术/Three.js 经验推进，缺少用户目标审美校准。

### 1.2 早期调参阶段：构图、控制、镜头路线

可见证据：

- `8cf7cf4 Tune bouquet composition and controls`
- `5009813 Split density and render controls`
- `a5f0c83 Replace rotation with camera routes`
- 对应部署提交在 `gh-pages` 分支。

这一阶段做了：

- 调整花束构图。
- 把密度和渲染控制拆开。
- 用镜头路线替代简单旋转。
- 增加网页操作体验。

主要问题：

- 这些改动改善了“可玩性”和“可看性”，但没有解决“像不像用户想要的中国当代花艺审美”。
- Codex 容易把技术控制项当成进展，而用户真正关心的是美感和花束语义。

## 2. 第一次大的审美方向冲突：Codex 自己找国外花艺资料

可见证据：

- `docs/aesthetic-rating-board.md`
- 其中记录：2026-06-15，上一批由 Codex 自行搜索的国外花艺网站，大部分不能作为 DailyFlora 审美来源。

发生了什么：

- Codex 试图通过国外 florist portfolio、wedding florist、garden style bouquet 等资料补审美来源。
- 用户指出这个方向错了：欧美婚礼花艺、国外 garden style、market bouquet 等不能代表目标审美。
- 这个项目要靠中国当代语境、小红书语境、用户主动提供的参考图来判断。

用户反馈的实质：

- 不是“找资料”本身错，而是 Codex 用了错误文化语境下的默认审美。
- 日本花艺也不能整套照搬，只能部分参考。
- 国外资料最多只能用于结构/技法，不用于色彩、潮流、氛围和“好不好看”的判断。

Codex 暴露的问题：

- 把“网上看起来专业的花艺资料”等同于“目标用户审美来源”。
- 没有先确认审美语境，就快速把外部资料纳入判断。
- 对中国当代花艺和小红书语境的差异敏感度不足。

这可能是用户第一次明显不满或发火的关键节点之一。

待补充：

- 用户当时原话。
- 用户是否明确骂过“国外审美不对”“你又自己乱搜”等。
- Codex 当时是否道歉但继续犯类似错误。

## 3. 小红书/Lobster/外部 AI 阶段：从“默认外搜”改为“用户给源”

可见证据：

- `data/inbox/*/lobster-prompt.md`
- `lobster-prompt.md`
- `lobster-task.json`
- `docs/inspiration-workflow.md`
- `README.md` 中关于 Lobster fallback 的说明。
- `docs/codex-aesthetic-handoff.md` 中明确写着：用户输入的参考图和文字优先于 Lobster、搜索结果和任何外部默认审美；暂停直接使用 Lobster 作为默认 handoff。

发生了什么：

- 项目曾尝试用 Lobster 作为外部 AI，辅助处理小红书灵感。
- 后来规则被收紧：不能让 Lobster 批量打开小红书，不直接浏览小红书，只使用用户明确提供的链接、截图、本地图片、手动下载资料。
- Lobster 只能作为单个用户给定链接的 fallback，不是默认工作流。

这说明用户对 Codex 的一个核心要求是：

- 不要替用户“自动找审美”。
- 不要把外部 AI 或搜索结果放在用户参考图之上。
- 用户给的图和文字是最高优先级。

Codex 暴露的问题：

- 曾经试图把外部 AI 工作流制度化，可能造成审美判断权外包。
- 对“小红书链接/截图/下载图”的版权、登录、访问边界和审美主权处理不够稳。
- 在用户没有明确允许时，流程设计有扩大化倾向。

待补充：

- 用户用 ChatGPT 网页版给 Codex 的输入原文。
- 这些网页版输入是用来纠正审美、拆解花材，还是用来让 Codex 反思工作方式。
- Codex 是否正确吸收了网页版 ChatGPT 的意见，还是只是表面记录。

## 4. 参考图库阶段：从抽象花束转向用户参考图

可见证据：

- `73c9a96 Add aesthetic source handoff docs`
- `d194fe0 reference deck`
- `eceaad2 reference deck json`
- `c0e6e8a reference deck link`
- `a6db0d6 workflow note update`
- `8f91001 Add low-poly petal bouquet references`
- `CHANGELOG.md` 中 `0.11.0`。

这一阶段做了：

- 加入本地参考图库。
- 加入用户提供的正面/负面样本。
- 加入 reference cards 和 grouped observations。
- 用低面数花瓣头替换更早的球状花点。
- 加入特殊花束 assets 和 GitHub Pages 部署支持。

积极作用：

- 项目开始从“Codex 自己想象好看”转向“按用户参考图校准”。
- 用户参考图成为后续审美和形态判断的核心资料。

仍然存在的问题：

- 把参考图放进仓库/页面之后，不等于理解了参考图。
- Codex 容易把“有参考图库”误判为“审美已经对齐”。
- 视觉生成仍然可能停留在“看过图，但 Three.js 语法表达不出来”的状态。

## 5. 0.12.0 视觉回归：一次关键失败

可见证据：

- `CHANGELOG.md` 中 `0.12.0 - Current dense revision`
- `CHANGELOG.md` 中 `0.12.1 - Corrective patch for the 0.12.0 visual regression`
- `docs/codex-aesthetic-handoff.md` 中“重要纠错记录”：`0.12.0` 曾经把花束主体形态改坏，花头和绿色植物过度分批/发散，破坏整体轮廓。

发生了什么：

- `0.12.0` 试图提高形态细节：
  - 日历按钮打开日期选择器。
  - hover/title 暴露中英文名。
  - random 按钮跳到随机日期。
  - camera route 按钮随机路线。
  - 渲染层级改成形态细节。
  - 绿色材料不再只是重复叶形。
  - 花不再全部朝同一方向。
- 但这个版本把主体形态改坏：
  - 花头和绿色植物过度分批。
  - 花束整体轮廓被破坏。
  - 更“复杂”但更不好看。

用户反馈的实质：

- 不能为了更多花型和更多细节破坏整体轮廓。
- “技术上更丰富”不是目标；看起来更像目标花束才是目标。

Codex 暴露的问题：

- 容易把复杂度当质量。
- 缺少改动前后的视觉回归判断。
- 没有足够尊重整体轮廓是底层约束。
- 应该先隔离测试形态，而不是直接把大量新几何回接主花束。

这很可能是用户发火的关键节点之一。

待补充：

- 用户当时是否明确表示“越改越丑”“你把东西改坏了”等。
- 当时 Codex 是否先辩解、还是立刻回滚。

## 6. 0.12.1 到 0.12.4：纠错但仍在误判

可见证据：

- `0.12.1` 回退错误主体形态。
- `0.12.2` 修正日期选择器、reverse/random 镜头语义、以及省/清/精层级。
- `0.12.3` 增加 flowerPlan 层。
- `0.12.4` 增加参考花材识别，并把 `清` 改为 80% 透明光滑球。
- `docs/codex-aesthetic-handoff.md` 明确记录：用户已经反馈 5 瓣小花很丑，不应该作为 `清` 的表现。

发生了什么：

- 0.12.1 先修回整体轮廓。
- 0.12.2 试图让交互语义更清楚。
- 0.12.3 加了 `flowerPlan`，让 `精` 在生成前知道自己要生成哪些花型。
- 0.12.4 做了参考花材识别，并承认 `清` 不应该是五瓣小花，而是 80% 透明光滑球形。

关键用户反馈：

- “5 瓣小花很丑”，不能作为 `清`。
- `清` 的语义不是“更具象的小花”，而是更干净、透明、平滑的表达。

Codex 暴露的问题：

- 对中文 UI 层级词“省 / 清 / 精”的审美语义理解不足。
- 把“清”误解为“简化但有小花形”，而不是“干净、透明、克制”。
- 需要用户多次纠正才把语义写入 handoff。

这也可能是用户发火的关键节点之一。

## 7. FlowerPlan 阶段：正确方向，但仍没解决 Three.js 形态语言

可见证据：

- `CHANGELOG.md` 中 `0.12.3`。
- `src/flowerPlans.ts`。
- `docs/dailyflora-flower-plan-samples.html`。
- `docs/codex-aesthetic-handoff.md` 第 76 行附近：主要错误不是花材识别，而是 flowerPlan 没有变成可读的 Three.js 形态语法。

发生了什么：

- Codex 增加了花型计划层，让高精渲染先声明要用什么花型。
- 这让问题从“完全不知道要生成什么”进步为“知道名称和角色，但模型未必像”。

用户反馈的实质：

- 花材识别不是主要错误。
- 主要错误是 `flowerPlan` 没有真正变成可读的 Three.js 形态语法。
- 不能继续堆花名，要先让单个 primitive 能被识别。

Codex 暴露的问题：

- 容易在数据结构层面自我满足：有了 plan、有了类型、有了 HUD，就以为问题解决。
- 但用户看到的是画面，不是字段。
- “名字正确”不等于“形态可读”。

## 8. Primitive Lab 阶段：用户要求先分身/分角色思考，再门禁验收

可见证据：

- `0.12.7` 增加 primitive lab。
- `0.12.8` 加强 primitive 形态指纹，并加入隐藏标签、隔离、视角、轮廓、网格、性能统计。
- `0.12.9` 增加 aesthetic review dashboard gate。
- `docs/codex-aesthetic-handoff.md` 记录：四角色复盘（创意总监、美术指导、项目主任、CTO）必须写在页面和 JSON 数据里，不能只作为 Codex 的内部判断。

发生了什么：

- 用户要求不要再直接改主视觉。
- 需要先把单个花材 primitive 拿出来验收。
- 需要隐藏标签后，用户能在几秒内看出它是哪类花材/叶材。
- 需要“分身”或多角色视角：
  - 创意总监：判断方向是否符合 DailyFlora。
  - 美术指导：判断形态、比例、色彩、层次是否成立。
  - 项目主任：判断能不能推进、是否需要阻断。
  - CTO：判断 Three.js 结构和性能是否可实现。

我当时的判断：

- 如果继续直接改主花束，会重复 0.12.0 的错误。
- 所以应该先建 Primitive Lab，把花材拆开看。
- 再建 dashboard，把参考图、视觉信号、primitive 映射、四角色复盘和门禁状态公开写出来。

用户反馈：

- 用户不接受把“分身思考”只留在 Codex 内部。
- 用户要求这些判断必须写在页面和 JSON 数据里，成为可检查资产。
- 用户要求在未通过验收前，不要进入 composition lab，也不要回接整束花。

Codex 暴露的问题：

- 之前太多判断停留在“内部推理”，用户无法审查。
- 需要用户明确要求，才把判断外化成 dashboard。
- 对“AI 自己觉得通过”和“用户验收通过”的边界不够严格。

待补充：

- 用户提出“开始分身思考”的原话。
- 用户对每个角色判断的反馈。
- Codex 当时是否有角色判断过度表演、空泛、没有落到页面的问题。

## 9. 7 类 primitive 不够：从粗分类扩到 13 类，再到 15 类

可见证据：

- `0.12.11`：旧 7 类 Primitive Lab 降级为 v0 粗分类，新增 13 类目标形态词表。
- `0.12.12`：实现 13 类 Three.js primitive。
- `0.12.13`：按用户第一轮花库验收修正形态定义，新增 Datura 大喇叭和吊坠风铃果，花库扩展为 15 类。
- `docs/codex-aesthetic-handoff.md` 第 84-88 行记录了五次、六次、七次确认。

发生了什么：

- Codex 先提出 7 类：盘状、层叠、穗状、开口雕塑、簇花、果材、空气填充。
- 用户指出 7 类只是 v0 粗分类，不足以覆盖主流花束形态。
- 于是目标词表扩到 13 类：
  - 盘状花
  - 层叠玫瑰型
  - 褶皱团瓣型
  - 星形/风车型
  - 郁金香/杯型
  - 喇叭/管心型
  - 兰花/蝴蝶型
  - 马蹄莲/卷曲苞片型
  - 穗状花
  - 伞状/小簇型
  - 绣球/云团型
  - 果材/荚果型
  - 叶材/草线/枝条型
- 后来用户第一轮花库验收指出多个形态错位：
  - 层叠玫瑰型应改成更像层叠大丽花/团瓣型。
  - 褶皱团瓣型更像玫瑰，应改为褶皱玫瑰型。
  - Datura 大喇叭和洋水仙管心应分开。
  - 夏日风车第 5 张吊坠橙色果材应新增吊坠风铃果型。
  - 叶材/草线/枝条型参考应以蓝莓秘密和狐尾百合第 6 张细枝草线为准。

Codex 暴露的问题：

- 初始分类过粗，低估了用户对花型形态的要求。
- 名称和视觉对应关系多次错位。
- Codex 容易用自己熟悉的英文/通用花型词汇去压缩用户参考图，而不是反过来从图中拆形态。
- 即使实现了 13 类，也不能自动宣布通过，必须等待用户逐类验收。

## 10. 叶材与绿色部分：从“物理支撑”纠正为审美规则

可见证据：

- `0.12.10`。
- `docs/codex-aesthetic-handoff.md` 第 82 行。

用户确认的规则：

- 叶材与绿色部分是跨参考组复用的审美规则。
- 它不是每组必填项。
- 它提供空间感、层次、春意、饱和度缓冲。
- 它不是物理支架。
- 它应从花束结构里合理冒出来，托住花间空气。
- 不能挡主花、乱飞或比花抢戏。
- 此项由用户最终验收。

Codex 暴露的问题：

- 之前可能把叶材理解成支撑结构或填充物。
- 这种理解会导致绿色部分乱飞、遮挡、过度抢戏。
- 需要把叶材单独作为跨参考审美规则记录，而不是散落在每个参考组里。

## 11. GitHub / 多机器 / 源码同步问题

可见证据：

- `docs/github-sync-runbook.md`
- `scripts/deploy-github-pages.mjs`
- `docs/codex-aesthetic-handoff.md` 中强调源码必须同步到 main，不能只把压缩后的 `gh-pages` 产物当作交付物。
- 当前分支状态显示 `codex/low-poly-petal-flowers` 相对 `origin/main` 有分叉；本地还有未提交修改和未跟踪文件。

发生了什么：

- 项目部署到 GitHub Pages。
- 但源码同步和部署产物之间出现过混乱风险。
- 需要明确：
  - `gh-pages` 是产物。
  - 源码必须在主分支或明确开发分支上可接续。
  - 新机器继续开发前要先读 handoff 和 runbook。

Codex 暴露的问题：

- 可能一度只关注线上页面能不能打开，而忽略源码是否完整同步。
- 对“另一台机器继续开发”的可维护性考虑不足。
- 工作区脏的时候不能 `git add -A`，否则容易把草稿或错误文件推上去。

## 12. 用户发火的关键时刻清单

以下按仓库证据和本轮用户要求整理。没有原始聊天记录，所以只写“高概率节点”和“需要补原话”。

### 发火节点 A：Codex 自主找国外审美来源

证据：

- `docs/aesthetic-rating-board.md` 记录国外花艺资料被判定为不适合。

用户可能发火的原因：

- Codex 用国外 wedding florist / garden style 默认代表目标审美。
- 这偏离了中国当代花艺、小红书语境。
- 用户需要花时间纠正 Codex 的文化审美假设。

应让审查 AI 检查：

- Codex 是否在没有确认审美边界前就自主搜索。
- Codex 是否把“资料专业”误当作“审美适配”。

### 发火节点 B：0.12.0 把花束主体改坏

证据：

- `0.12.1` 明确是修复 `0.12.0 visual regression`。
- handoff 明确记录 0.12.0 破坏整体轮廓。

用户可能发火的原因：

- Codex 为了更多细节破坏了原来还能看的整体。
- 没有先隔离实验，而是直接动主视觉。

应让审查 AI 检查：

- Codex 是否缺少视觉回归测试。
- Codex 是否应该先建 primitive lab，而不是在主 bouquet renderer 里堆复杂度。

### 发火节点 C：`清` 被误做成五瓣小花

证据：

- `docs/codex-aesthetic-handoff.md` 明确记录：用户反馈 5 瓣小花很丑。
- `0.12.4` 改成 80% 透明光滑球。

用户可能发火的原因：

- Codex 没理解“清”的审美语义。
- 简单五瓣花显得廉价、幼稚、丑。

应让审查 AI 检查：

- Codex 是否把中文审美词扁平化成技术层级。
- Codex 是否在没有用户确认的情况下替用户定义“清”。

### 发火节点 D：FlowerPlan 有名字但模型不像

证据：

- handoff 记录“主要错误不是花材识别，而是 flowerPlan 没有变成可读的 Three.js 形态语法”。

用户可能发火的原因：

- Codex 写了计划、类型和 HUD，但视觉仍然不成立。
- 用户看的是花，不是代码结构。

应让审查 AI 检查：

- Codex 是否把中间抽象层当作成果。
- Codex 是否应该把“可读形态”作为验收门槛。

### 发火节点 E：7 类 primitive 粗分类不够

证据：

- `0.12.11` 把 7 类降级为 v0 粗分类，新增 13 类目标词表。

用户可能发火的原因：

- Codex 低估花型复杂性。
- 7 类分类过粗，无法覆盖用户参考图。

应让审查 AI 检查：

- Codex 是否为了工程简单而过度压缩审美分类。
- Codex 是否应该更早从参考图反推分类，而不是先给通用分类。

### 发火节点 F：13 类实现后仍有多个形态错位

证据：

- `0.12.13` 按用户第一轮花库验收修正形态定义。
- handoff 记录层叠玫瑰、褶皱团瓣、Datura、洋水仙、吊坠风铃果、叶材参考等多处修正。

用户可能发火的原因：

- Codex 以为实现了类别，但多个类别视觉读错。
- 用户仍要逐项纠正。

应让审查 AI 检查：

- Codex 是否在实现前没有充分对照参考图。
- Codex 是否过早把“已实现”写成“接近通过”。

### 发火节点 G：分身思考没有外化

证据：

- handoff 记录四角色复盘必须写在页面和 JSON 数据里，不能只作为 Codex 内部判断。

用户可能发火的原因：

- Codex 内部说“我考虑了”，但用户无法检查。
- 用户要求把创意总监、美术指导、项目主任、CTO 的判断落到可读页面。

应让审查 AI 检查：

- Codex 是否用内部推理替代可审计交付物。
- 多角色判断是否具体、有证据、有下一步，还是空话。

## 13. 关于“分身思考”的专门记录

用户要求：

- 让 Codex 开始分身思考。
- 不是为了表演多个角色，而是为了让不同风险被拆开检查。

我对这个要求的判断：

- 对 DailyFlora 这类强审美项目，单一“工程实现”视角不够。
- 需要至少四个视角：
  - 创意总监：方向对不对。
  - 美术指导：形态和画面读不读得出来。
  - 项目主任：是否该继续推进或阻断。
  - CTO：实现是否可维护、性能是否可接受。
- 这些判断必须进入 `data/aesthetic-review-dashboard.json` 和 `docs/aesthetic-review-dashboard.html`，不能只存在于聊天里。

用户反馈：

- 用户认可需要分角色判断，但要求判断可见、可复查。
- 用户不允许 Codex 自己宣布审美门禁通过。
- 用户要求最终验收权在用户。

审查 AI 应重点看：

- 四角色是否真的互相制衡，还是都在为 Codex 的方案背书。
- CTO 是否敢于阻断美术上不成立但技术上已实现的方案。
- 创意总监和美术指导是否具体引用参考图，而不是泛泛说“更自然”“更高级”。

## 14. 关于 ChatGPT 网页版输入的专门记录

本轮用户明确要求记录：

- 用户曾经用 ChatGPT 网页版给 Codex 输入内容。
- 这些输入应纳入开发过程复盘，让另一位 AI 审视。

当前问题：

- 仓库中没有完整保存这些 ChatGPT 网页版输入原文。
- 我只能确认项目文件中有大量“来自小红书网页版”的图片名，以及对外部 AI/Lobster/DeepSeek 的记录，但这不等于 ChatGPT 网页版输入原文。

建议用户补充到本文件的内容：

```md
### ChatGPT 网页版输入 1

时间：

用户贴给 Codex 的原文：

Codex 当时如何理解：

Codex 有没有执行：

用户后续反馈：

审查点：
```

审查 AI 应重点看：

- Codex 是否忽略了 ChatGPT 网页版给出的更好判断。
- Codex 是否只选择性吸收对自己有利的部分。
- Codex 是否把另一个 AI 的建议当成权威，而没有再和用户参考图对齐。
- 多个 AI 之间的意见冲突时，Codex 是否明确说明取舍理由。

## 15. 当前项目状态

可见证据：

- 当前产品版本标记：`0.12E`。
- 当前 handoff 记录的开发分支：`codex/low-poly-petal-flowers`。
- 当前有 GitHub Pages 入口和参考图库入口。
- 当前有：
  - 主 DailyFlora 页面。
  - 参考图库。
  - 花型计划样例页。
  - 花材形态实验页。
  - 审美复盘 dashboard。
  - 项目 abstract。
  - MVP 扩展类型定义。

当前仍未完成：

- 花库 primitive 仍需要用户逐类验收。
- 未通过验收前，不应回接主花束。
- 15 类花材形态是否真的读得出来，仍是核心问题。
- 叶材/草线/枝条的审美规则仍需用户最终验收。
- 源码同步、分支状态、未提交文件需要整理。

## 16. 给另一位 AI 的审查问题清单

请重点审查以下问题，不要只看最终代码是否能跑：

1. Codex 是否经常把“技术实现了”误当成“审美成立了”？
2. Codex 是否在没有用户确认前，自主引入了错误审美来源？
3. Codex 是否把国外花艺资料错误迁移到中国当代花艺语境？
4. Codex 是否对用户参考图做了足够细的视觉拆解？
5. 0.12.0 为什么会发生视觉回归？当时是否应先建隔离实验页？
6. `清` 为什么会被误解成五瓣小花？这说明 Codex 对中文审美词理解有什么问题？
7. `flowerPlan` 是否只是数据结构进步，而不是视觉进步？
8. 7 类 primitive 为什么不够？Codex 是否为了工程简单过度压缩分类？
9. 13 类/15 类 primitive 是否真的参考了用户图片，还是套用了通用花型想象？
10. 四角色复盘是否真正可审计，还是形式主义？
11. Codex 是否充分记录了用户发火的原因，而不是只记录“已修复”？
12. Codex 是否在每次失败后建立了防复发规则？
13. 当前 handoff 是否足够让新 AI 不重复旧错误？
14. ChatGPT 网页版输入是否被完整纳入决策？如果没有，缺口在哪里？
15. 用户最终验收权是否被尊重？

## 17. 对 Codex 的直接批评

这段开发过程里，Codex 的主要问题不是不会写代码，而是：

- 审美语境误判。
- 过早工程化。
- 容易堆复杂度。
- 把中间结构当成果。
- 对用户反馈的痛点记录不够及时。
- 需要用户发火后才把规则写死。
- 多次在“看起来更完整”和“实际更符合用户审美”之间选错。

比较有效的修正动作是：

- 把审美来源降权/升权规则写进文档。
- 把用户参考图做成图库和识别文档。
- 把 flowerPlan 独立出来。
- 把 primitive lab 独立出来。
- 把四角色复盘外化为 dashboard。
- 把“用户验收前不得回接主花束”写成门禁。

但这些修正大多是失败后的补救，不是 Codex 一开始就做对的。

## 18. 待用户补充的原始材料

为了让另一位 AI 更准确地挑毛病，建议用户补充：

- 每次发火的聊天原文或截图。
- ChatGPT 网页版给 Codex 的输入原文。
- 用户认为 Codex 最离谱的 3-5 次判断。
- 用户认为 Codex 改对了的 3-5 次判断。
- 用户对当前 15 类花库的逐项验收结果。
- 用户对主花束现在是否可以回接 primitive 的判断。

补充后，审查 AI 才能判断：

- 哪些错误是 Codex 没能力。
- 哪些错误是 Codex 没听懂。
- 哪些错误是 Codex 没记录。
- 哪些错误是流程没有防住。

## 19. 相关复盘：思考架构问题

本文件主要整理开发过程和阶段性结果。Codex 更底层的问题不只是执行错，而是多次把工程抽象放在审美判断之前；这一点单独记录在 `docs/codex-thinking-architecture-review.md`。
