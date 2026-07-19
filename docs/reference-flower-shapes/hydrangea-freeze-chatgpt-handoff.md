# DailyFlora Hydrangea 冻结校准｜交给 ChatGPT 的视觉复核包

> 请把这份 Markdown 和下方列出的 6 张 PNG 一起交给 ChatGPT。  
> 这不是开放式重做任务，而是一次严格受限的视觉参数复核。

## 1. 项目与页面

- 项目：DailyFlora
- 页面：`docs/realistic-flower-lab.html`
- 主要代码：`src/realisticFlowerForms.ts`
- 花型：绣球 Hydrangea
- 目标园艺类型：`Hydrangea macrophylla` mophead 绣球
- 当前状态：**冻结**

当前目标不是继续增加植物学真实性，也不是设计新模型，而是保持历史最佳视觉方向，只做克制的参数校准。

## 2. 唯一视觉基准

历史基准为 commit：

```text
0b3655c
```

请把该 commit 中的 `createHydrangea` 视为唯一模型方向。当前代码中的 `createHydrangeaBaseline` 已恢复到这套基础逻辑。

成立的视觉特征：

- 柔和、清楚的蓝色花球
- 花球由许多可辨认的四萼片装饰花组成
- 外轮廓饱满，但不是连续几何壳面
- 单花尺度相对稳定，不是随机碎片贴球
- 整体像 DailyFlora 的偏写实花材，而不是植物扫描模型

## 3. 冻结边界

禁止建议或实施以下内容：

- 修改花瓣或单花 geometry
- 修改黄金角分布算法
- 新增花序层级
- 新增花蕾系统
- 新增内部支撑结构
- 新增随机分布逻辑
- 新增另一套生成器
- 用深色中心、孔洞或大量尺度随机制造“真实感”
- 修改其他花型、首页、daily bouquet、Special Edition 或路由

只允许讨论以下参数：

- `flowerCount`
- `scale range`
- `radius range`
- `cloudCenter`
- overlap spacing（只能由上述密度、尺度和半径参数间接控制）

如果建议需要超过 10 行代码，请停止，因为那意味着模型方向已经被改变。

## 4. 本轮修改数字

冻结前恢复版：

```ts
const flowerCount = 104;
const cloudCenter = new THREE.Vector3(0, 0.4, 0);
const radius = rng.range(0.58, 0.65);
const scale = rng.range(0.95, 1.05);
```

本轮参数版：

```ts
const flowerCount = 100;
const cloudCenter = new THREE.Vector3(0, 0.4, 0);
const radius = rng.range(0.59, 0.67);
const scale = rng.range(0.94, 1.04);
```

实际只修改了 3 行：

| 参数 | 修改前 | 修改后 | 意图 |
|---|---:|---:|---|
| `flowerCount` | 104 | 100 | 轻微降低密度 |
| `radius range` | 0.58–0.65 | 0.59–0.67 | 让花球稍松，减轻规则半球感 |
| `scale range` | 0.95–1.05 | 0.94–1.04 | 略微缩小重叠，并保持尺度稳定 |
| `cloudCenter` | `(0, 0.4, 0)` | 不变 | 不改变整体构图和重心 |

曾测试过更激进的 `98 / 0.59–0.68 / 0.93–1.03`，但侧视和顶视过疏，开始出现较明显暗缝，因此没有保留。

## 5. 三个视觉指标

只判断以下三项：

### A. 花球轮廓

目标：比冻结前恢复版稍微松一点，不要进一步变成规则半球或完整球壳。

### B. 单花可读性

目标：减少过度重叠，让四萼片轮廓在正常观察距离仍然可读；不能靠夸张大小差异实现。

### C. 空气感

目标：轻微降低密度，但不能出现大面积黑洞、深裂缝或内部穿透感，也不能变成连续壳面。

## 6. 三视图对比

### 正面

修改前：

![修改前正面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-freeze-2026-07-15/before-front.png)

修改后：

![修改后正面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-freeze-2026-07-15/after-front.png)

### 侧面

修改前：

![修改前侧面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-freeze-2026-07-15/before-side.png)

修改后：

![修改后侧面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-freeze-2026-07-15/after-side.png)

### 顶视

修改前：

![修改前顶视](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-freeze-2026-07-15/before-top.png)

修改后：

![修改后顶视](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-freeze-2026-07-15/after-top.png)

对应图片文件名：

```text
before-front.png
before-side.png
before-top.png
after-front.png
after-side.png
after-top.png
```

## 7. 当前初步判断

- 正面：整体仍然是统一的蓝色花球，没有回到洞洞壳方向。
- 侧面：花朵间遮挡略有减少，部分四萼片轮廓更清楚。
- 顶视：空气感略有增加，但中央暗缝是最需要审慎判断的区域。
- 外轮廓：变化非常轻微，没有更换模型方向。
- 色彩、单花 geometry、朝向算法和花球重心均未改动。

## 8. 请 ChatGPT 回答的问题

请直接依据六张截图逐项回答，不要提出重做模型：

1. 修改后是否比修改前更接近“花簇”，还是开始显得过疏？
2. 正面、侧面、顶视中，哪一个视角最需要回调？
3. 顶视中央暗缝是否已达到“黑洞感”的风险线？
4. `100 / 0.59–0.67 / 0.94–1.04` 应保留，还是应在允许范围内回调？
5. 如果回调，请只给出一组明确数字，不要提供多个分支方案。
6. 请明确判断：保留当前参数、回到修改前，或做一次不超过 3 行的参数调整。

建议回复格式：

```text
结论：保留 / 回退 / 微调

A. 花球轮廓：
B. 单花可读性：
C. 空气感：

建议参数：
flowerCount =
radius range =
scale range =
cloudCenter =

理由：
```

## 9. 工程验证状态

- `npm run build`：通过
- Vite：67 modules，10.57 秒
- 控制台 error/warn：无
- 未修改 geometry
- 未修改花型算法
- 未扩散修改范围

这次验收应以截图为主，不以代码复杂度为依据。
