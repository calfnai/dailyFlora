# DailyFlora Codex 接入与美感来源维护

最后更新：2026-07-13

这份文档用于在另一台电脑上接入 DailyFlora，并让新的 Codex 线程继续维护美感来源、版本进度和生成规则。

## 当前项目状态快照

- 当前 npm 版本：`0.14.10`
- 当前产品层标记：`0.14`
- 当前主要同步分支：`main`
- 线上入口：<https://calfnai.github.io/dailyFlora/>
- 线上参考图库：<https://calfnai.github.io/dailyFlora/docs/dailyflora-reference-gallery.html>
- 本地参考图库：`docs/dailyflora-reference-gallery.html`
- 审美复盘 dashboard：`docs/aesthetic-review-dashboard.html`
- 花材识别文档：`docs/reference-flower-identification.md`
- 花型计划样例页：`docs/dailyflora-flower-plan-samples.html`
- 花材形态实验页：`docs/primitive-lab.html`
- 0.13 审美系统总纲：`docs/dailyflora-aesthetic-system-0.13.md`
- 项目 Codex skill：`docs/dailyflora-codex-skill.md`
- 项目本地 skill 入口：`.codex/skills/dailyflora/SKILL.md`
- 版本提要：`CHANGELOG.md`

另一台机器的 Codex 必须先读：

1. `docs/dailyflora-aesthetic-system-0.13.md`
2. `docs/dailyflora-codex-skill.md`
3. `.codex/skills/dailyflora/SKILL.md`
4. `docs/codex-aesthetic-handoff.md`
5. `CHANGELOG.md`
6. `docs/aesthetic-review-dashboard.html`
7. `data/aesthetic-review-dashboard.json`
8. `docs/dailyflora-reference-gallery.html`
9. `docs/reference-flower-identification.md`
10. `src/flowerPlans.ts`
11. `src/bouquetScene.ts`
12. `src/floraPrimitives.ts`
13. `docs/primitive-lab.html`

不要只看代码。这个项目的生成判断依赖用户连续纠正过的审美规则。

## 2026-06-25 已确认规则

- 用户输入的参考图和文字优先于 Lobster、搜索结果和任何外部默认审美。
- 暂停直接使用 Lobster 作为默认 handoff；除非用户明确要求，不要重新启用 Lobster 流程。
- 不要直接浏览小红书。只使用用户给出的链接、截图、本地图片、手动下载后的资料。
- 不要在没有用户确认的情况下改变生成规则。
- 用户不给每日审美输入时，默认继续按 0.13 审美系统和日期 seed 生成每日花束；用户给的新链接只作为增量校准，先进入 pending。
- 版本必须连续记录；当前线索从 `0.1`、`0.11`、`0.12.0` 到 `0.12.5`。
- 每次重大改动必须更新 `CHANGELOG.md`。

## 当前渲染层级定义

- `省`：低面数球形/花球底模。
- `清`：光滑球形，80% 透明度。不要再用 5 瓣小花。
- `精`：唯一尝试明确花型差异的模式。必须通过 `flowerPlan` 先声明花型，再生成模型。

用户已经明确反馈：5 瓣小花很丑，不应该作为 `清` 的表现。

## 当前交互规则

- 日历按钮：打开日期选择器，位置必须贴近日历按钮，不能跑出浏览器可触控范围。
- 日历 input 必须和日历按钮处在同一个定位容器里，不能再用全局 fixed 坐标临时覆盖按钮。
- 选完日期后：日期选择器应自动关闭或失焦。
- 默认今日花束页如果整晚打开，应在本地跨日后自动切到新日期；手动选择日期、随机日期、固定 seed 和特殊花束不能被强制改回今天。
- random 日期按钮：随机跳到某一天对应的花束页面。
- 圆形 reverse 按钮：只反转当前镜头路线。
- 星形/预设按钮：随机生成新的镜头路线预设。
- 审美审核入口只在 debug 版主界面可见，不能只靠用户记住 `docs/aesthetic-review-dashboard.html`。
- debug 版由 URL 参数 `?debug` 或 `?debug=1` 开启；debug 版必须显示当前 FPS 和资源占用信息。
- 普通观赏模式不显示审美审核入口，审美复盘页本身也必须检查 `debug` 参数。
- GitHub Pages 发布时不能用原始 HTML 覆盖 Vite 已编译的 `docs/aesthetic-review-dashboard.html`；否则 dashboard 和 Primitive Lab 的脚本不会执行，页面会退化成只剩静态文字。
- 新增关键审美记忆或 skill 文档时，必须同时加入 `scripts/deploy-source-files.json`；如果 dashboard 要在线上链接这些文档，还要在部署脚本中复制到 `dist/docs`。
- 自动隐藏 UI 上的按钮必须有清楚的人话提示。

## 当前审美判断

从参考图库和图像识别中提炼出的花材/形态角色：

- 盘状花：洋甘菊、雏菊、非洲菊/太阳花感的大花盘。
- 层叠圆花：玫瑰、花毛茛、山茶/牡丹/乒乓菊类。洋桔梗为用户明确排除项，不进入默认花库或花束计划。
- 穗状花：飞燕草/翠雀、狐尾百合、金鱼草、风信子、蛇鞭菊类。
- 开口雕塑花：蝴蝶兰、洋水仙、马蹄莲、郁金香/百合类。
- 球簇花：绣球、小球菊、密集小花团。
- 果材：浆果、风铃果、小圆果点。
- 空气填充：满天星、米花、蜡梅感小点、细枝、藤线、蕨叶/草叶。

生成器不应该只知道“好看/不好看”，而要知道每束花里有哪些花型角色、占比、位置和避免项。

2026-06-25 进一步确认：花材识别不是主要错误，主要错误是 flowerPlan 没有变成可读的 Three.js 形态语法。下一阶段不要继续增加花名，先验收 primitive lab：隐藏标签后，单个形态应能在几秒内区分出盘状、层叠、穗状、开口雕塑、簇花、果材和空气填充。

2026-06-25 二次确认：primitive lab 仍不能算通过。不要进入 composition-lab，直到七个 primitive 在标签隐藏状态下能独立通过 3 秒识别。源码必须同步到 main，不能只把压缩后的 `gh-pages` 产物当作交付物。

2026-06-25 三次确认：后续主视觉修改前必须先更新审美复盘 dashboard。四角色复盘（创意总监、美术指导、项目主任、CTO）必须写在页面和 JSON 数据里，不能只作为 Codex 的内部判断。

2026-06-25 四次确认：叶材与绿色部分是跨参考组复用的审美规则，不是每组必填项。叶材提供空间感、层次、春意和饱和度缓冲，不是物理支架；它应合理地从花束结构里冒出来，托住花间的空气，不能挡主花、乱飞或比花抢戏。此项由用户最终验收。

2026-06-25 五次确认：Primitive Lab 的旧 7 类只是 v0 粗分类，不足以覆盖主流花束形态。目标形态词表按 13 类审查：盘状花、层叠玫瑰型、褶皱团瓣型、星形/风车型、郁金香/杯型、喇叭/管心型、兰花/蝴蝶型、马蹄莲/卷曲苞片型、穗状花、伞状/小簇型、绣球/云团型、果材/荚果型、叶材/草线/枝条型。

2026-06-25 六次确认：13 类 Three.js primitive 已进入 `src/floraPrimitives.ts` 和 `docs/primitive-lab.html`，但状态是等待用户逐类验收，不得因为已经实现就自动宣布通过，也不得在未验收前回接整束花。

2026-06-25 七次确认：用户第一轮花库验收指出多个形态错位。层叠玫瑰型应改为更像“其他正面参考2”的层叠大丽花/团瓣型；褶皱团瓣型更像玫瑰，应改为褶皱玫瑰型；Datura 大喇叭和洋水仙管心应分开；夏日风车第5张的吊坠橙色果材应新增吊坠风铃果型；叶材/草线/枝条型参考应以蓝莓秘密和狐尾百合第6张的细枝草线为准。花库现为 15 类，页面术语“Primitive Gate”应面向用户显示为“花库验收”。

2026-06-26 八次确认：用户针对 Primitive Lab 4-9 给出明确状态：4 星形/风车型比上一版差，需回归/小修；5 郁金香/杯型重做；6 洋水仙管心型方向可保留继续修；7 Datura 大喇叭型参考方向认可但渲染重做；8 蝴蝶兰保留花蕊并在上一版基础上改花瓣比例；9 马蹄莲重做。`0.12.14` 已按这些状态修一轮，并把用户判定写入 Primitive Lab 与 dashboard，但 4-9 仍等待用户复验，不得标记通过，不得回接主花束。

2026-06-26 九次确认：用户复验 `0.12.14` 后指出：2 和 3 更像了，必须拆开；7 太像一个喇叭，不像花；8 比例对但花瓣角度错，应往上上次正确角度回调；9 越来越接近但卷曲未闭合，应继续沿当前角度拉长卷曲；10 不如上上版；11 仍有小花单面观察性，必须 360 可看；13 球太大、密度不够；14 完全不对，不能用胶囊体糊弄。`0.12.15` 已按这些问题修一轮，但仍等待用户复验，不得标记通过，不得回接主花束。

2026-06-26 十次确认：用户确认 “PRIMITIVE GATE / 花库验收总算能达到及格线”。`0.12.16` 已将 dashboard gate 改为 pass，将 15 类花库条目标为本轮门禁通过，并把参考图组从 primitive blocked 改为 composition needs-work。下一阶段可以开始受控的整束 composition 验证，但每次主视觉修改仍必须同步 dashboard；不要把“达到及格线”误读成最终视觉已经完成。

2026-06-26 十一次确认：按用户要求，`0.12.17` 暂停新增一轮审美复盘，直接把已及格花库 primitive 应用到主花束 `精` 渲染；TARGET SHAPE VOCABULARY 卡片也已嵌入实时 Three.js primitive 预览。低/中渲染仍保留轻量旧路径。

2026-06-26 十二次确认：用户要求 `spike-vertical-form / 穗状花` 回退到更直的版本，不要统一弯曲度；如果弯曲也必须是每次随机弯曲。`0.12.18` 已将 `SpikeFlower` 改回直立中轴，只保留极小 seed-based lean 和小花错落。同时主页面新增手动 zoom in / zoom out 与滚轮/触控板缩放。

2026-06-26 十三次确认：用户指出花库 primitive 接入后默认镜头太近，看不清完整花束。`0.12.19` 已把默认相机距离整体拉远，并扩大手动 zoom-out 范围。

2026-06-26 十四次确认：用户指出 `foliage-grass-branch / 叶材草线枝条型` 在空旷位置出现时很诡异，因为旧 primitive 是上宽下窄的根部草束形态，只在根部成立。`0.12.20` 已改为沿一段枝线分布叶片和草线的空间材料，并减少主花束中孤立悬浮的叶材 accent。

2026-06-26 十五次确认：用户认为繁星夜色、海盐柠檬、月光手捧整体已可接受，主要问题是整束中的竖直穗状花延伸方向太统一。山岗小花更严重，顶部出现一大片穗状花不自然；穗状花应穿插在花丛中。`0.12.21` 只改 composition：穗状花单体仍保持直，但整束摆放增加随机倾斜方向；山岗/狐尾 plan 降低顶部穗花占比，把穗花混入中层、外圈和小花/簇花之间。

2026-06-26 十六次确认：用户确认穗状花“穿插”的感觉对了，但指出新版穗状花全部朝聚拢方向，缺少开洋感。`0.12.22` 保留穿插位置，只改整束朝向：穗状花倾斜方向改为基于实际空间位置向外打开，少量侧向交叉，避免整体向内收束。

2026-06-26 十七次确认：用户指出当前综合效果最好的是山岗小花，并质问标题中英双语消失、日历选择框位置仍不正确。`0.12.23` 将山岗小花记录为当前 composition 正向样本：小花矩阵承接饱和色，低位簇花托住体积，穗状花穿插而不成片，线条外开形成空气。UI 上恢复 HUD 可见中英双语标题，并把日历 input 锚定在按钮同一容器中。

2026-06-26 十八次确认：用户要求恢复审美审核页面入口，因为需要看到 Codex 对审美理解的进度；并要求按 Codex 当前理解凭空生成一组新花束加入项目。`0.12.24` 在主界面恢复可见审美审核按钮，新增原创主题 `晨露莓园 / Dewberry Morning`，并在 dashboard 中将它登记为 `needs-owner-review` 候选。该候选学习山岗小花的空间语法：小花矩阵、低位簇花、果点归属、穗线穿插外开、绿色托住空气，但不能自动宣布通过。

2026-06-26 十九次确认：用户认可晨露莓园空气束方向不错，并要求新增 debug 版开关：只有 URL 带 `debug` 才能打开 debug 版；只有 debug 版能进入审美复盘；debug 版显示当前渲染 FPS 和资源占用。同时指出上下拖拽方向反直觉，左右拖拽保留；UI 上播放按钮要放在 reverse 按钮左边。`0.12.25` 已实现这些交互和门禁。

2026-06-26 二十次确认：用户要求把 Codex 对审美的理解、流程、skills 和记忆写进项目，作为一个大版本。`0.13.0` 已将项目审美系统固化为 `docs/dailyflora-aesthetic-system-0.13.md`，将项目 Codex skill 固化为 `docs/dailyflora-codex-skill.md` 和 `.codex/skills/dailyflora/SKILL.md`，并把这些文件接入 README、project abstract、dashboard 和发布清单。后续新线程不得只依赖聊天上下文，必须先读这些项目内记忆。

2026-06-26 二十一次确认：用户指出 0.13 没有继续追问和修正 CTO 口径，也没有兑现角色是否合并/新增的讨论；同时指出山岗小花和热带丛林中有一种好看的小面花未进入 TARGET SHAPE VOCABULARY。`0.13.1` 将 CTO 改为“生成架构审查”，新增“花材库管理员”视角，正式把 `CosmosOpenFlower / 波斯菊/小面花型` 登记为第 16 类目标形态。另按用户反馈：马蹄莲单体保留但整束比例下调；伞状/小簇型绿色假茎缩短并降低透明度；果材/荚果型暂记为同类风险较轻，继续观察。

2026-07-02 二十二次确认：用户提供 `Lychee Garden｜捏一个彩虹🌈` 作为今日审美参考，并明确如果日后没有每日输入，Codex 也已掌握足够审美每日生成。`0.13.3` 将该链接写入 `data/inbox/2026-07-02/`、`data/inspiration-library.json` 的 pendingRecommendations，并同步新增 `data/aesthetic-review-dashboard.json` 的 `荔枝花园彩虹 / Lychee Garden Rainbow` 审美审核卡；公开可读信号是自然风、彩虹、多巴胺配色、绚丽色彩。该信号只能作为多色/彩虹方向的增量参考：颜色按花材角色分配，保留绿色和空气缓冲，果点必须有枝条归属；不自动修改生成器、不标记通过。

2026-07-02 二十三次确认：用户纠正“新增参考的时候，要放在审美审核里”。后续任何 owner-provided 审美参考，即使只是短链、文字标题或 pending 状态，也必须进 `data/aesthetic-review-dashboard.json`，并至少包含人话结论、正向信号、负向约束、primitive 映射、当前实现、未通过原因、下一步任务和角色复盘；不能只写 inspiration library。

2026-07-02 二十四次确认：用户纠正“新的花花就应该有新的地址”。后续新增花束不能借用别的主题地址展示；必须创建独立 theme/flowerPlan/URL。即使用户之后不用，也应弃用该地址本身，而不是把它改指向其他花束。`0.13.4` 因此新增 `lychee-garden-rainbow` 专属主题、同名 flowerPlan、专属 primitive/palette 映射，并把 dashboard 的“打开生成花束”指向 `?date=2026-07-02&seed=lychee-garden-rainbow&theme=lychee-garden-rainbow&render=high&density=medium`。

2026-07-02 二十五次确认：用户确认“这个花花做得很好”。`lychee-garden-rainbow` 可以从待确认改为 pass，作为 DailyFlora 已通过的彩虹/多巴胺多色增量样本。用户还要求后续每天挑 token 剩余 95% 以上的闲时执行每日花花生成并自动推到 GitHub；已创建 Codex cron 自动化 `DailyFlora 每日花花生成并发布`，每天本机 03:35 运行，任务必须先确认上下文余量、构建、部署 GitHub，并检查线上入口。

2026-07-03 二十六次确认：用户确认之前临时允许的审美现在都可以通过，后续会根据实际运行页面写反馈。`0.14.0` 将 dashboard 中的晨露莓园、夏日风车、梦幻紫、洋水仙季节、会呼吸的风景、狐尾百合、浆果森林、秋日果汁、荔枝花园彩虹和反向边界统一作为当前通过审美基线。后续不要把这些组当作 pending blocker；如果页面实际表现有问题，新增反馈和修正记录。

2026-07-11 二十七次确认：用户指出旧 Primitive Lab 把模型和文字分离，缺少可读价值；页面应采用 dashboard 的 `Target shape vocabulary / 16 类目标形态词表` 信息结构。第一轮曾误做成 16 个独立渲染框，用户随后纠正：不要为每类建立一个 WebGL 框，而应在一个大画布里同时放 16 朵以上的花，并把中英文名称和说明放在花旁边。`0.14.4` 最终改成一个共享 3D 画布：16 个正式花型加 1 个候选花型共同陈列，每朵花旁显示中英文名、识别说明和状态；保留正面/侧面/顶视、轮廓、网格、自动旋转和单花拖动检查。后续新增花型继续放进同一画布，不回到“每朵一个渲染上下文”的结构。

2026-07-11 二十八次确认：用户回忆并要求继续完善 7 月 5 日的 trumpet-throat v1/v3 正确方向。该方向的有效部分是六片花被、cup/corona、副冠褶边、深喉、可见花蕊、绿色连接点和不改变正面基准的 360° 查看；v2 重画导致花型偏离，继续只作为失败记录。`0.14.4` 新增 `FrilledNarcissusFlower / 褶边副冠水仙型` 候选，暂不把正式花库从 16 改成 17；只有用户确认其正面、侧面和旋转状态都真正做得好，才正式登记。

2026-07-11 二十九次确认：用户要求沿 7 月 4 日的细分思路建立独立的“偏写实花型 LAB”，把原始 26 个具体花名删除洋桔梗后固定为 25 种。洋桔梗是明确的个人反感项，不能再作为玫瑰型示例、柔软团花默认替代或未来花束候选。`0.14.5` 的偏写实花型不并入 Primitive Lab，而是在一个共享大画布中展示 25 种具象花材，并为潜在 3D 打印加入连续花梗、花托、实体分枝和花瓣嵌接；当前目标是视觉和结构上无漂浮件，正式商品化前仍需布尔合并、最小壁厚、水密性、流形和打印方向工程校验。

2026-07-12 三十次确认：用户进一步确认“花型多起来，新建的花花就会变得很丰富”，允许把偏写实 LAB 中截图之外的 16 种具体单花加入 Primitive Lab：雏菊、洋甘菊、非洲菊、太阳花、银莲花、波斯菊、大丽花、玫瑰、花毛茛、山茶、牡丹、乒乓菊、郁金香、洋水仙、蝴蝶兰、马蹄莲。截图中的飞燕草、金鱼草、风信子、狐尾百合、蛇鞭菊、蕾丝花、绣球、满天星、米花共 9 种先不并入，待后续讨论怎么改。`0.14.6` 的 Primitive Lab 因此为 16 类抽象词表 + 16 种具象单花 + 1 个候选，共 33 项，仍只使用一个 WebGL 画布。

2026-07-12 三十一次确认：用户指出原先 16 种具有抽象夸张的美感，而偏写实花型少了这一层意味；后续应把科幻方向发展成第三层花型语言。`0.14.7` 首次试做 `OrbitalPulseFlower / 星环脉冲花型` 候选：中心能量核、双层放射花瓣、两组有实体辐条连接的轨道环、光脉花蕊和背部生命连接点。它必须先读成花和生命体，不能退化成机械徽章或漂浮圆环；用户验收前不进入正式词表。

2026-07-12 三十二次确认：用户喜欢星环脉冲花，但纠正它的结构其实仍然写实，所谓科幻感主要来自配色；因此它改为“写实骨架 × 非现实配色”对照组。真正科幻形态必须在灰模下仍然不可能来自现实植物。`0.14.8` 新增独立“科幻花型 LAB · 用户配色版”，以莫比乌斯连续单面、递归分叉、相位折叠和奇点内卷四种结构做重点测试，并把配色拆成 UI 独立变量：一键预设、随机配色、主色/辅色/能量色/节点色/生命基座五个自选色。效果通过用户验收后，配色 UI 才进入主体项目。

2026-07-12 三十三次确认：用户指出每日花束长期只显示重复的主题中文名，尤其在“疏/省”状态下视觉差异较小，无法确认每天是否真的生成和上传。后续每日标题必须显示日期印记和由日期 seed 决定的独立中英文花名，同时保留主题、flowerPlan 和花材列表供追溯。`0.14.9` 为 7 月 7 日命名“星点果汁风车”，为 7 月 11 日命名“紫雾游枝”，并让其他日期通过确定性命名词组产生不同名称。

2026-07-12 三十四次确认：用户拒绝 7 月 7 日中心铺满、像球和一坨的构图，要求回炉；同时指出 7 月 11 日穗状花角度过于统一、长度奇怪、在半空出现且没有花茎连接，共同走向也不指向同一花瓶。`0.14.9` 对默认日期 seed 做两组定向修正：7 月 7 日降低中心团花与簇花权重、尺寸和总花量，增加小花、果点、枝线、闪点和径向留白；7 月 11 日缩短并下沉穗花、降低重复线花权重。全局穗花 composition 改为从共同扎口推导生长轴，并以实体曲线花茎连接扎口和花穗底部。两束花等待用户复验，不标记通过。

2026-07-12 三十五次确认：用户明确要求将本轮讨论视为对 Codex 审美判断的重要纠正，并长期记录在项目中。后续不能把它降级成 7 月 7 日与 7 月 11 日的日期特例。必须继承三组跨日期规则：第一，缤纷来自小花、果点、枝线、局部主花与空气间隔的点状节奏，不来自把颜色和花头填满成球；第二，随机角度不等于自然，所有花材先服从共同扎口、连续花茎和真实生长路径，物理断裂本身就是审美失败；第三，每日 seed 必须形成用户可辨认的花名、日期身份、flowerPlan 和地址，不能让低细节模式或重复主题名掩盖每日生成事实。以上规则已加入 dashboard 的 `reusableAestheticRules` 和 0.13 审美系统，后续不得删除或只在单日参数中处理。

2026-07-12 三十六次确认：用户要求定期审视审查角色是否仍有用。`0.14.10` 保留创意总监、美术指导、生成架构审查和花材库管理员，但改为按职责触发；项目主任因与既有门禁流程高度重叠，降为版本阶段、用户验收或发布门禁变化时才启用。后续重要版本至少做一次角色审计，职责重叠就合并或降级，不为维持角色数量而重复输出。

2026-07-12 三十七次确认：用户指出偏写实花型 LAB 与科幻花型 LAB 的说明文字严重遮挡 3D 模型，导致无法看清花型。`0.14.10` 将文字从覆盖层改成独立信息区：桌面为模型左/文字右，移动端为模型上/文字下；Three.js scissor/viewport 同步扣除文字区，模型重新居中，不能再用“把模型往左挪”假装解决遮挡。

2026-07-13 三十八次确认：用户指出今日默认花束不好看，核心原因是花的品种不够丰富。排查确认 `2026-07-13` 默认 seed 抽到 `tropical-forest / 热带丛林` theme 与 `berry-grove / 浆果森林束` flowerPlan；该 plan 仍只从老 `FlowerTypeId` 中选择少数抽象角色，主花束 renderer 最终约映射到 6 种 primitive。0.14.6 虽把 16 种具象单花加入 Primitive Lab，但这批花没有进入每日默认 flowerPlan 类型系统和主花束候选池。后续修复方向不是只给 7 月 13 日加特例，而是扩展 `src/types.ts`、`src/flowerPlans.ts` 和 `src/bouquetScene.ts` 的类型与映射，让每日默认生成有最小花材丰富度，并真正用上具象花库。

同日继续修复：新增 `daily-concrete-forest-variety / 百花莓园空气束`，并让 `2026-07-13` 默认 seed 使用该 plan。它混合波斯菊、银莲花、大丽花、玫瑰、花毛茛、郁金香、洋水仙、小蝴蝶兰、莓果点、空气小簇和嫩绿枝线，目标是先修今天“品种不够丰富”的问题，仍等待用户复验。同时修正每日中文名重复 bug：默认命名不能只靠 8 个 mood 与 plan 名组合，需加入日期专属月标记和日标记；名字可以凭审美生成，但普通日期不能重名。

同日继续纠错：用户指出线上科幻新花束 LAB 仍没有体现此前“形态太丑”的反馈。莫比乌斯翻面、递归裂枝、相位折叠和奇点内向四种形态不得再进入整束花展示，也不能用配色掩盖形态失败；`docs/scifi-bouquet-lab.html` 暂时只保留已被用户喜欢过的 `OrbitalPulseFlower / 星环脉冲花` 作为“写实骨架 × 非现实配色”的对照组，默认显示多黑少金的黑金信号。旧四种形态必须回到灰模重新设计，用户重新认可前不得进入正式词表或花束 LAB。

同日继续纠错：用户进一步指出科幻花束 LAB 的整体外部形态也失败，不能像“半透明塑料薄膜罩住的小束花”，而应像其他花束一样外形缤纷、多样，并且科幻意味充足。`src/scifiBouquetLab.ts` 因此不得再使用半透明包裹面作为外轮廓；科幻感应来自星环脉冲、开放式发光光轨、果点、空气小簇、草线枝条、多种真实花型和更外放的星云轮廓。默认色板可用缤纷的“星云花火”，黑金只作为可选预设。

2026-07-13 三十九次确认：用户查看线上 Primitive Lab 后明确确认 `OrbitalPulseFlower / 星环脉冲花型` 可以验收。它从候选升级为正式可用的混合花型，分类固定为“写实骨架 × 非现实配色”；这个通过不能被误写成真正结构科幻形态已经通过。用户同时提醒：审美复盘 Dashboard 不只是给用户验收，Codex 在可能忘记审美时也必须主动回看。后续凡涉及 composition、整体轮廓、花材比例、叶材关系、主视觉或新花型入束，动手前先读 Dashboard 的通过基线、可复用规则、回炉记录和反向样本，不能总等用户再次指出花花整体形态问题。

2026-07-16 四十次确认：用户指出当天默认花束里 `蛇鞭菊线形 / 风信子穗形 / 金鱼草穗形` 让整体美感崩塌：茎太粗、飞出屏幕、每支含花量和长度一致，蛇鞭菊炸开的花蕊尤其假；满天星密度需要提高 3 倍。根因是主花束把这些名称都映射到同一个 `SpikeFlower` 模板，暂缓并入的穗状/簇状具体花材在没有独立通过前被高比例使用。后续规则：金鱼草、风信子、蛇鞭菊不能只换色不换结构；每支串串花必须有不同长度、花序段、花量、花距和粗细；蛇鞭菊应贴轴成绒毛瓶刷感，不能用外炸长花蕊补复杂度；满天星/空气白点可以更密，但仍应轻、小、分散。

## 当前决定性文件

- `docs/dailyflora-aesthetic-system-0.13.md`：0.13 审美系统总纲，记录目标花束、反向约束、叶材规则、花库门禁、composition 经验和流程。
- `docs/dailyflora-codex-skill.md`：项目内 Codex skill，记录接手项目时必须执行的工作方法。
- `.codex/skills/dailyflora/SKILL.md`：项目本地 skill 入口，指向完整 skill 文档。
- `src/bouquetScene.ts`：最终 Three.js 花束形态和材质，决定视觉结果。
- `src/floraPrimitives.ts`：可复用花材 primitive，后续应逐步替换 `精` 渲染里的匿名几何。
- `src/flowerPlans.ts`：生成前花型计划，决定 `精` 模式尝试哪些花材角色。
- `data/aesthetic-review-dashboard.json`：参考图到 primitive、验收状态和审查角色复盘的数据源。
- `docs/aesthetic-review-dashboard.html`：继续改主视觉前必须阅读的人类可读门禁页。
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
- `0.12.9` 增加审美复盘 dashboard，把参考图、视觉信号、primitive 映射、四角色复盘和门禁状态放到可读页面。
- `0.12.10` 将叶材与绿色部分升级为 dashboard 的全局复用审美规则，并明确由用户最终验收。
- `0.12.11` 将 7 类 Primitive Lab 降级为 v0 粗分类，并在 dashboard 中新增 13 类目标形态词表。
- `0.12.12` 实现 13 类 Three.js primitive，并把 Primitive Lab 扩展为 13 类验收页。
- `0.12.13` 按用户第一轮花库验收修正形态定义，新增 Datura 大喇叭和吊坠风铃果，花库扩展为 15 类。
- `0.12.14` 按用户对 4-9 的逐项判定做回归/重做修复，并在 lab/dashboard 中显示用户验收状态；主花束仍未回接。
- `0.12.15` 按用户复验继续修 2、3、7、8、9、10、11、13、14，并同步 lab/dashboard 状态；主花束仍未回接。
- `0.12.16` 记录用户确认花库门禁达到及格线；允许进入整束 composition 验证准备，但主花束仍未改。
- `0.12.17` 将花库 primitive 直接应用到主花束 `精` 渲染，并把实时模型贴进 TARGET SHAPE VOCABULARY 卡片。
- `0.12.18` 将穗状花回直，并为主网页增加手动缩放。
- `0.12.19` 拉远默认镜头，让整束花默认可读。
- `0.12.20` 修正叶材/草线/枝条型，避免空中出现上宽下窄的根部草束。
- `0.12.21` 修正整束 composition 中的穗状花：方向不再统一，山岗小花不再把穗花集中堆在顶部。
- `0.12.22` 修正穗状花外开方向：保留穿插，但避免朝内聚拢，恢复开洋感。
- `0.12.23` 恢复 HUD 中英双语标题，修正日历选择器按钮锚点，并把山岗小花确定为当前 composition 正向样本。
- `0.12.24` 恢复主界面审美审核入口，并新增原创候选花束 `晨露莓园 / Dewberry Morning`。
- `0.12.25` 将审美审核入口收进 `?debug` 模式，增加 FPS/资源 debug 面板，修正上下拖拽方向，并把播放按钮放到 reverse 左侧。
- `0.12.26` 修复发布脚本覆盖编译页的问题，恢复 dashboard、Primitive Lab、参考图库和花束库在线可用。
- `0.13.0` 将 DailyFlora 审美理解、流程、项目 skill 和记忆写入仓库，形成后续 Codex 必须读取的 0.13 审美操作系统。
- `0.13.1` 修正审查角色机制，新增花材库管理员，并将 CosmosOpenFlower 补登记为第 16 类目标形态；同时修 Calla 整束比例和 Umbel 假茎倒三角问题。
- `0.13.2` 补齐默认今日花束页的本地跨日自动重建逻辑；固定日期、随机预览、固定 seed 和特殊花束保持锁定。
- `0.13.3` 接收 `Lychee Garden｜捏一个彩虹🌈` 作为 owner-provided pending inspiration，补齐 `xhslink.com` 短链读取，将新增参考同步放入审美审核 dashboard，并记录“无每日输入也按既有审美系统每日生成”的工作方式。
- `0.13.4` 将 `Lychee Garden Rainbow` 从 borrowed preview 改为独立花束地址：新增 `lychee-garden-rainbow` theme、同名 flowerPlan 和专属 renderer 映射；记录新花必须有新地址，弃用时弃用该地址本身。
- `0.13.5` 记录用户确认 `Lychee Garden Rainbow` 做得好，将 dashboard 状态改为 pass，并创建每日自动构建和 GitHub 发布任务。
- `0.14.0` 建立低成本 MVP 路由结构，新增开发组目录、客户占位页、member/admin mock 页和轻量固定样例库；同时记录用户确认当前审美组全部进入 pass 基线，未来按实际运行页面反馈迭代。

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
这是 DailyFlora 0.13 项目。请先阅读 docs/dailyflora-aesthetic-system-0.13.md、docs/dailyflora-codex-skill.md、docs/codex-aesthetic-handoff.md 和 CHANGELOG.md。
不要只凭“理解了”继续改视觉。先判断问题属于 primitive、composition、palette、camera/UI 还是 deploy。
用户是当前审美验收人；未经用户确认，不要把 Codex 的判断写成 pass。
国外花艺网站和 Lobster 不能作为默认审美来源；用户给过的参考图和文字优先。
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
