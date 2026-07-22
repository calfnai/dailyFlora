# DailyFlora 叶片原型状态记录 v1

日期：2026-07-23

范围：记录两个已验收原型从独立调试到首批受控成员映射的状态；不表示全部植物成员配置完成。

## Strap prototype

```ts
prototypeStatus: 'approved-controlled-integration'
recommendedBaseline: 'strap-d2-basal-v1'
```

### 已验证方向

- D2 已作为稳定的带状叶二维 silhouette baseline。
- Strap 3D Mini Lab 已验证扇形而非 360° 放射布局。
- 已建立 5 片叶的初步年龄层级：外层成熟叶与内层幼叶。
- 已建立共同基部抽生关系的方向，而不是独立叶片插座。
- 已验证浅沟截面、薄边缘和基础 3D 弯曲方向。
- 已保留独立 Mini Lab 调试视图，用于 front、side、top、perspective、base detail、section 和 silhouette 检查。

### 冻结与接入边界

当前 strap 继续通过 `rootLift`、`rootDepth`、`rootSlope`、`rootArc` 等参数微调，已经开始出现厚纸片穿插、碎切口和复杂拓扑，继续收益不足。

因此停止继续迭代 strap 的原型几何，并只做受控成员映射：

- 不继续修改 strap silhouette。
- 不继续增加根部参数。
- 不继续增加网格密度。
- 不继续修补底边。
- 已映射洋水仙、风信子与狐尾百合，叶序为基生。
- 主花束只在现有花材计划实际包含已映射成员时生成少量 Strap 叶片。
- 不因叶片接入修改花朵计划、花朵 RNG 或主要构图。
- 不宣称 Strap 是 production-ready 的具体物种扫描叶型。

### 尚未解决的问题

1. 基部仍缺少真实叶鞘的连续包合拓扑。
2. 局部存在薄片穿插和程序化切口。
3. 外层成熟叶的自然弯曲仍不足。
4. 目前是受控程序化原型，不是正式植物扫描模型。
5. 只绑定洋水仙、风信子与狐尾百合；其他成员不得自动复用。

## Palmate prototype

```ts
prototypeStatus: 'approved-controlled-integration'
venation: 'palmate'
bladeTopology: 'simple'
bladeOutline: 'palmately-5-lobed'
recommendedBaseline: 'major-structure-envelope-v1'
```

### 概念纠正

`palmate` 描述的是掌状叶脉系统，不是固定轮廓。

当前验证对象不是笼统的 `palmate leaf`，而是：

```ts
venation: 'palmate'
bladeTopology: 'simple'
bladeOutline: 'palmately-5-lobed'
```

也就是：一片具有掌状一级主脉的五裂单叶。

## Palmate 2D exploration history

二维阶段先后经历以下探索，全部不作为当前 baseline：

### P1 / P2 / P3

- 将 `palmate` 错误地直接翻译成五个掌形凸起。
- 裂片像手指、花瓣或徽章附件，整体读成青蛙、皇冠、海星或手掌符号。
- 叶基与叶柄插入区域不成立，底部甚至出现向下的额外裂片。

### Skeleton / E1 / E2

- 尝试以五条一级主脉骨架自动生成裂片轮廓。
- 实际仍形成“五根手指 + 中央身体”，未建立宽阔连续叶身。
- 中央、上侧、下侧裂片的宽度和层级错误，叶基仍像圆盘或第六裂片。

### M0 / M1 / M2

- 转向 mother blade retention 法，先生成完整母叶，再从边缘局部切入四个叶窦。
- 方法概念比五指骨架正确，但初始母叶像圆盾、软菱形或徽章。
- M1 / M2 只是在错误母叶上挖缺口，仍读成黑色团块、耳朵或卡通图形。

### New M0 / M1 / M2 与 M0b / M1b / M2b

- 重建母叶后减少了青蛙读感，但母叶仍偏盾牌、图标或带尖底的团块。
- M1b / M2b 没有形成清楚的左右上侧裂片和左右下侧裂片，只形成卵形叶两侧的缺口。
- 面积保留率、中央叶肉宽度和叶窦深度等硬指标反而阻止了真实五裂结构形成。

因此已撤销以下硬验收规则：

- `M1 retention >= 90%`
- `M2 retention >= 85%`
- 下侧叶窦必须极浅。
- 必须尽量保留原母叶面积。
- `central body width` 和 `lower sinus depth` 的固定比例门槛。

这些数据只允许作为观察信息，不再主导轮廓几何。Current M2b 仅保留为错误对照。

## Palmate 2D reference history

### 真实参考图

T1 改用真实参考图地标描摹，不再由算法自由设计五裂轮廓。

参考图：Wikimedia Commons, `File:Acer platanoides scanned leaf.jpg`

- 植物：Norway maple，`Acer platanoides`。
- 作者：Andrew Butko。
- 许可：CC BY-SA 3.0 / Wikimedia Commons metadata。
- 来源链接：https://commons.wikimedia.org/wiki/File:Acer_platanoides_scanned_leaf.jpg
- 本地调试缩略图：`docs/assets/leaf-silhouette-lab/reference/acer-platanoides-scanned-leaf-reference-900.jpg`

选择原因：

1. 参考图为正面扫描，叶片基本平展。
2. 背景简单，轮廓清楚。
3. 具有明确中央裂片、左右上侧裂片、左右下侧裂片、四个叶窦和叶柄插入区域。
4. 适合建立简化槭属五裂单叶的二维几何参照。

简化项：

- 不保留锯齿。
- 不保留真实叶脉颜色或纹理。
- 不使用照片作为贴图。
- 不绑定具体 realistic flower 成员。
- 只抽取主要轮廓地标和五裂结构关系。

### Landmarks 方法

Leaf Silhouette Lab 的 `Reference + Landmarks` 面板显示低透明度参考图、归一化坐标网格、叶缘描摹线，并显式记录：

- 叶柄插入点。
- 左右叶基肩部。
- 中央裂片尖端。
- 左右上侧裂片尖端。
- 左右下侧裂片尖端。
- 四个叶窦最低点。
- apex 中心轴。

地标由代码显式录入，不自动识别，也不再从圆形母叶、卵形母叶、五条放射线或面积保留率推导最终轮廓。

### T1 历史二维 baseline

T1 是依据同一组真实参考地标生成的纯黑闭合轮廓，并同时具备：

- 1 个中央裂片。
- 2 个上侧裂片。
- 2 个下侧裂片。
- 4 个清楚叶窦。
- 1 个明确叶柄插入区域。

T1 曾作为 Palmate 首个可用二维 baseline：

- 不加入随机轮廓差异。
- 不加入锯齿。
- 不重新自由设计五裂形状。
- 不再回到 mother blade retention 法。
- 不再回到五条主脉自动生成轮廓的方法。

后续真实参考 overlay 验收发现 T1 对中央裂片、上下侧裂片和叶基的概括仍然过度，因此 T1 已降级为历史阶段，不再驱动 3D。

## Palmate accepted Major Structure Envelope

- 参考图继续使用 `Acer platanoides` 正面扫描图。
- 以 24 个独立大结构地标记录叶柄插入点、叶基肩部、五个主裂片、四个主要叶窦和裂片回收段。
- 地标忽略局部小锯齿，只描述主裂片外包络。
- 局部曲线使用 bounded controls，地标位置冻结，不允许无约束平滑重新塑形。
- 当前冻结标识：`major-structure-envelope-v1`。
- T2a Structural Smooth 与 accepted envelope 的大结构一致；T2b 仅作为轻锯齿观察，不作为本次 3D 输入。
- 二维轮廓不再返回 mother blade、自由生成、60 点逐点平滑或旧 T1 路径。

## Palmate 3D Mini Lab current status

```ts
prototypeStatus: 'approved-controlled-integration'
baseline: 'major-structure-envelope-v1'
```

### 当前完成内容

- 使用已冻结的 24 点 Major Structure Envelope 作为叶片二维输入，前视叶身轮廓保持冻结。
- 叶片为单片 simple leaf，保持超薄，叶缘薄于叶身中央区域。
- 使用轮廓三角化、三级细分和内部点松弛建立连续叶面。
- 移除由单一中心点主导的放射扇网格，减少分块薄板和长斜线束读感。
- 掌状一级脉只使用极浅 3D relief，并按中央、上侧、下侧逐级减弱。
- 不使用颜色画叶脉，不加入细小 secondary veins。
- 取消整叶统一大杯形，以轻微纵向拱面、叶脉间叶肉下垂和裂片局部姿态形成克制起伏。
- 中央裂片、左右上侧裂片和左右下侧裂片具有轻微、确定性的不同抬起、外展或下垂。
- 叶柄不再使用独立圆柱，已改为与叶基同一闭合网格中的扁平渐宽过渡。
- 叶柄插入区、两侧叶基肩部、上表面与下表面保持连续，不增加第六裂片或厚底座。
- section 分为 `mid-blade` 与 `basal transition` 两组截面，用于分别检查叶身厚度和叶柄—叶基连接。

### 调试视图

`docs/palmate-3d-mini-lab.html` 提供：

- `front`
- `back`
- `side`
- `top`
- `perspective`
- `base-detail`
- `section`

显示模式：

- `normal`
- `silhouette`
- `wireframe`

### 当前边界

- 仍不是 production-ready 的具体物种叶型。
- 已受控映射给飞燕草，用于表达掌状分裂识别线索；它不是飞燕草真实叶片的精确扫描。
- 当前主花束计划尚未包含飞燕草，因此不为展示 Palmate 而改动花朵构图。
- 其余 realistic flower 成员不得自动复用 Palmate。
- 原型几何继续冻结，不再返回二维轮廓循环。

### 当前结论

Palmate 已完成基于 `major-structure-envelope-v1` 的独立 3D Mini Lab，并保留极浅掌状一级脉、裂片局部姿态、叶脉间轻微下垂及连续叶柄—叶基过渡。经用户验收后，它已作为受控程序化原型映射给飞燕草；映射不代表真实物种扫描，不扩散到其他成员。

跨叶片与花型共用的研究流程见：[偏写实植物器官研究方法 v1](./realistic-organ-research-method-v1.md)。
完整成员矩阵见：[写实花型—叶片成员映射 v1](./realistic-leaf-member-mapping-v1.md)。
