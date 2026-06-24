# DailyFlora 审美到参数规范

最后更新：2026-06-22

这份规范的目标很简单：把“我喜欢什么样的花”变成“生成器今天应该怎么长”。

它不是审美散文，也不是来源清单。它是一个中间层，负责把用户输入的参考，稳定翻译成 DailyFlora 可以直接使用的参数建议。

## 这份规范解决什么问题

- 让审美输入持续复用，而不是只对某一次对话有效。
- 让 three.js 生成结果真正可控，而不是只靠随机种子碰运气。
- 让未来如果接 TouchDesigner，也能沿用同一套语义，不需要重写一套标准。

## 现在真正能生效的参数

当前网页生成器直接使用的可控项，主要来自这些字段：

- [`src/spec.ts`](/Users/ziqing/Documents/dailyFlora/src/spec.ts)
- [`src/themes.ts`](/Users/ziqing/Documents/dailyFlora/src/themes.ts)
- [`src/bouquetScene.ts`](/Users/ziqing/Documents/dailyFlora/src/bouquetScene.ts)

现阶段最直接可调的是：

- `palette`
- `leafPalette`
- `stem`
- `background`
- `glow`
- `densityBias`
- `verticalBias`
- `wildness`
- `branchBias`
- `leafBias`
- `flowerBias`
- `outerLineBias`
- `branchDensity`
- `sparkleDensity`
- `flowerDensity`
- `leafDensity`
- `rotationSpeed`
- `asymmetry`
- `haloLift`

## 审美输入的三层结构

每条参考都按这三层写，后续才方便落地。

### 1. 视觉结论

一句话说明整体感觉。

例子：

- 夏日多巴胺
- 轻盈但不空
- 可爱、明亮、有中国小红书语境
- 360 度都成立

### 2. 正向信号

只写真正可转译的观察，不写空泛评价。

优先写这些：

- 色彩关系
- 体积关系
- 前后层次
- 小花 / 枝条 / 叶材 / 星点的节奏
- 视角变化时是否仍成立
- 有无明确的主花压顶

### 3. 负向约束

这部分比“喜欢什么”更重要，因为它能防止生成器跑偏。

优先写这些：

- 不要单一超大主花
- 不要只在正面好看
- 不要太婚礼
- 不要太平面
- 不要过度自然散乱
- 不要重心塌在中间

## 信号到参数的映射

下面是最重要的部分。以后看到审美描述，就按这张表转。

| 审美信号 | 直接含义 | 对应参数方向 |
| --- | --- | --- |
| warm bright / 多巴胺 / 阳光感 | 画面更明亮、更轻快 | 提高暖色权重，偏 `palette` 的黄、桃、浅绿 |
| airy / 轻盈 / 有呼吸感 | 边缘松、空隙明确 | 提高 `outerLineBias`，适当提高 `haloLift`，保持 `asymmetry` 有一点点 |
| 360 degree / 侧面也成立 | 不是单面贴图 | 提高 `branchBias`、`leafBias`、`wildness`，让轮廓从各个角度都成立 |
| compact but not dense / 紧凑但不闷 | 有体积但不堵 | 保持 `densityBias` 中等，不要把 `flowerDensity` 拉满 |
| small flowers / 星点 / 杂花节奏 | 主体之外有节拍 | 提高 `sparkleDensity`，让粒子和外逸线更活 |
| no oversized focal bloom | 不让一朵花压住全局 | 避免过高的 `flowerBias` 方向；保持花头数量中等，依靠小尺度材料补结构 |
| natural but structured | 有野感，但不是乱 | 保持 `wildness` 中高，配合 `branchDensity` 和 `leafDensity`，不要只增随机性 |
| calm / soft / dreamy | 旋转和视角更慢、更柔 | 降低 `rotationSpeed`，收一收摄像机路线幅度 |
| lively / energetic | 视角更有动感 | 适度提高 `rotationSpeed`，或增加摄像机路径变化 |

## 现在的现实限制

这部分需要说清楚，避免把审美误认为“已经被程序精确控制”。

- 目前代码里，单个花朵的显式尺寸控制并不强，更多是通过 `flowerDensity`、主题权重和整体结构来影响观感。
- 所以“不要大主花”现在主要是一个**生成约束**，不是一个独立旋钮。
- 如果以后想更严格地控制花头大小，最好再加一个 `flowerScale` 或 `focalSizeBias` 一类的参数。

## 推荐的输入格式

以后你给参考时，尽量按这个结构来：

```json
{
  "title": "夏日多巴胺",
  "positiveSignals": [
    "warm bright palette",
    "small-flower rhythm",
    "360-degree volume",
    "airy but readable"
  ],
  "negativeSignals": [
    "single oversized focal bloom",
    "flat front-facing composition",
    "bridal bouquet mood",
    "overly natural chaos"
  ],
  "parameterSuggestions": [
    "bias palette toward yellow, peach, fresh green",
    "raise branchBias and outerLineBias",
    "keep flowerDensity moderate and use small particles for rhythm",
    "lift halo points to strengthen airy edges",
    "keep rotationSpeed medium rather than fast"
  ]
}
```

## 推荐的写法规则

### 要写的

- 颜色是偏暖、偏冷、偏亮、偏灰，还是多色跳跃。
- 结构是圆的、竖的、散的、紧的，还是有明显侧面层次。
- 材料是偏小花、枝条、叶片、莓果、草、星点，还是偏大朵主花。
- 是否需要 360 度成立。
- 是否需要更像真实花束，还是更像梦境颗粒。

### 不要只写的

- “好看”
- “高级”
- “有感觉”
- “很日系”
- “很适合 DailyFlora”

这些词可以保留，但只能作为结论，不能直接作为生成指令。

## TouchDesigner 怎么接

如果以后把 TouchDesigner 接进来，这份规范仍然能用，只是映射对象会变成：

- 颜色 ramp
- 粒子分布
- 噪声强度
- 吸引场 / 拉伸场
- 体积包络
- 节奏频率

也就是说，TD 不是另一套审美标准，它只是另一种执行器。

## 当前建议

以后每次新增参考，至少要补三句：

1. 它最像哪种视觉结论。
2. 它最该避免什么。
3. 它最能改动哪个参数。

这样审美输入才能真正长期进入生成器，而不是停留在“聊天里觉得不错”。
