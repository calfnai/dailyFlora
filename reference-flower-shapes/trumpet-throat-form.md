# Trumpet Throat Form Reference

状态：首版参考库条目 / started
目标样本量：80 张照片
当前首轮观察：10 个网页图片结果 + 5 类植物学/园艺说明来源
用途：只给 Codex、人工开发和审美复盘判断 `trumpet-throat-form` 是否太抽象；不作为正式渲染素材导入。

## 1. 范围定义

`trumpet-throat-form` 在 DailyFlora 中暂时对应水仙 / 洋水仙类的管心花型，核心不是“所有喇叭状花”，而是：

- 外圈六枚花瓣状 tepals 形成星形背景。
- 中心有明显 cup / corona / trumpet，从花面向前伸出。
- corona 口沿常有波浪、褶皱、齿状或颜色加深的 rim。
- 管心内部不是空洞，应能看到阴影、花药、花丝、花柱或柱头的简化结构。
- 花头通常由无叶花茎支撑，叶子多为从基部冒出的长条带状叶，不是从花头旁边长出的小叶。

它不等同于：

- `datura-trumpet-form`：更像整朵花就是一个大喇叭。
- `calla-curled-bract`：单片卷曲苞片 + 肉穗，不是六 tepals + corona。
- 百合 / 喇叭百合：六瓣本身构成喇叭，没有独立的中央 corona。
- 玫瑰 / 大丽花：靠多层花瓣形成体积，不是中央管心。

## 2. 首轮来源池

本条目先记录来源类型和形态结论。照片本体默认不搬进仓库。

### 已观察的首批网页图片结果

| 编号 | 来源类型 | 观察重点 | 对 primitive 的启发 |
| --- | --- | --- | --- |
| P001 | daffodil anatomy front view | 正面六 tepals，中心黄色 corona，anthers / filament / style / stigma 可见。 | 正面不能只有一个空杯，杯内要有 3-6 个小花药点和中心柱。 |
| P002 | daffodil longitudinal section | 侧剖能看到 corolla tube、ovary、ovules、stamens，花瓣从管部外侧打开。 | 侧面连接点要是绿色管颈 + 卵形子房，不要直接把杯子粘在茎上。 |
| P003 | annotated garden daffodil | 黄色 tepals 后退，橙色 corona 口沿更突出，anthers 从中心露出。 | rim 颜色和厚度可以成为识别锚点。 |
| P004 | white/yellow daffodil front close-up | 白色六 tepals + 黄色 cup，rim 有细小波浪。 | DailyFlora 可用外白内黄配色快速提升水仙识别度。 |
| P005 | extreme corona close-up | corona 口沿不规则，内壁有径向纹理，花药集中在喉部深处。 | 需要内壁径向纹理或明暗渐变，避免塑料圆锥。 |
| P006 | side profile corona diagram | 侧面是长管状 trumpet，六 tepals 像星形背板，花茎弯曲连接。 | 侧视轮廓必须是“星背板 + 突出管心”，不是平面花盘。 |
| P007 | dissected Narcissus tazetta | 短 cup 也属于同族参考，能看到 upper/lower stamens、style、stigma。 | 可做短杯 variant，不要所有 trumpet 都一样长。 |
| P008 | daffodil center macro | 口沿橙色加深，内壁从黄到绿暗，边缘有非对称缺口。 | rim 不应完美圆，允许轻微破口、波浪、厚薄变化。 |
| P009 | hoop-petticoat / bulbocodium reference | corona 远大于外圈 tepals，外圈 tepals 很细小。 | 可作为极端 trumpet ratio variant，但不作为默认。 |
| P010 | cyclamineus-type reference | 长窄 trumpet，外圈 tepals 向后反卷，花头倾斜。 | `tepalReflex` 和 `headPitch` 应可调。 |

### 推荐继续补样的来源类型

80 张目标不应全部是正面美图。建议按下面比例补足：

| 样本组 | 目标数量 | 目的 |
| --- | ---: | --- |
| front close-up / 正面近景 | 20 | 观察 six tepals、corona rim、中心花药和喉部阴影。 |
| side profile / 侧面轮廓 | 15 | 判断 trumpet 长度、flare、花茎连接、花头角度。 |
| 45-degree view / 半侧面 | 15 | 判断 3D 体积，避免只做正面 icon。 |
| dissected / anatomy / 剖面 | 10 | 理解 floral tube、ovary、stamen、style 的位置。 |
| plant habit / 整株与叶片 | 10 | 判断叶子和花茎从哪里出现。 |
| cultivar variation / 品种变化 | 10 | 观察 cup 长短、rim 颜色、tepal 反卷和大小比例变化。 |

## 3. 花瓣轮廓

默认视觉锚点：六枚外圈 tepals，不是普通花瓣，也不是多层玫瑰瓣。

可执行描述：

- 数量：稳定 6 枚，分成两个三枚 whorls；可轻微错位重叠。
- 形状：椭圆到披针形，基部较窄，中段变宽，末端圆钝或轻微尖。
- 姿态：从 corona 基部向外张开，常在同一平面附近形成星形，也可以略微向后反卷。
- 表面：有柔和纵向脉络，不需要复杂纹理，但不能像干净塑料片。
- 边缘：轻微波动、轻微厚度、轻微非对称；不要六片完全复制。

DailyFlora primitive 要求：

- 从正面看，外圈必须读成“六瓣星形背板”。
- 从 45 度看，tepals 应在 corona 后方，不要和 cup 混成一坨。
- 小尺寸时，六瓣可以简化，但轮廓至少要保留 5-6 个外向尖/圆角。

反向约束：

- 不要做成菊花式很多窄瓣。
- 不要做成大丽花式密集多层。
- 不要做成百合式六瓣直接围成喇叭。
- 不要让 tepals 比 corona 更抢戏，除非做白瓣黄心的清晰水仙视觉。

## 4. 花心结构

默认视觉锚点：中心 corona / trumpet / cup。

可执行描述：

- 基部：从六枚 tepals 的交汇处向前伸出，有收窄的 throat。
- 形体：从窄 throat 到宽 rim 的 funnel / trumpet / cup。可以是长 trumpet，也可以是短 cup。
- 口沿：常有 frilled / scalloped / wavy rim；边缘颜色可能更橙、更深或更暖。
- 内壁：有径向纹理或明暗梯度，从口沿亮处进入喉部暗处。
- 中心：六枚 stamens 围绕一条 style / stigma。DailyFlora 可简化成 4-6 个小黄褐色花药 + 1 个中心浅色柱头。

DailyFlora primitive 要求：

- corona 不要是一个干净圆锥。要有口沿厚度、波浪、内壁深度和中心小结构。
- rim 可以用一圈小的 sinusoidal edge / scallop ring 实现。
- 花药要放在喉部内侧，不要漂浮在口沿外。
- 可做颜色梯度：inner throat 偏绿暗，middle yellow，rim orange/yellow-white。

反向约束：

- 不要像喇叭玩具。
- 不要像杯子插在六瓣上。
- 不要把 cup 内部做成纯黑洞。
- 不要把 stamen 做成外露触手。

## 5. 花瓣层级

trumpet-throat 的层级很少，但前后关系强。

层级顺序：

1. 后层：六枚 tepals，形成星形背板。
2. 中前层：corona / cup / trumpet，从中心向前伸出。
3. 微层：rim 皱边、内壁径向纹理、喉部阴影。
4. 内部点睛：stamens、style、stigma。
5. 后连接：绿色 ovary / floral tube / papery spathe。

生成建议：

- 不要增加很多花瓣层来“变复杂”。这个花型的复杂度来自 cup 与六瓣的空间关系。
- 高精度模式可以显示 rim scallop 和 stamen；低精度模式至少保留六瓣 + 中央 cup + 暗喉部。

## 6. 花头朝向

真实水仙类常见朝向不是全部正对镜头。

可执行描述：

- 正面：最容易识别，适合少量 hero flower。
- 45 度：最能体现 trumpet 体积，适合主花束。
- 侧面：能看到突出管心和花茎连接，适合边缘花或线条方向。
- 下垂 / 倾斜：部分水仙类花头会微垂或与茎形成角度，尤其不是笔直朝上。

DailyFlora composition 要求：

- bouquet 中的 trumpet-throat 应向外打开，朝向不能全部平行。
- 默认 hero flower 可 15-35 度偏转，避免图标感。
- 如果花头在边缘，mouth direction 应朝向外侧空气，不要全部朝中心。

反向约束：

- 不要把所有 cup 都正对镜头，容易像 UI icon。
- 不要让 cup 朝下但 tepals 朝上，空间关系会坏。
- 不要把它当穗状花竖着插。

## 7. 花萼 / 连接点

水仙类不是常见“绿色萼片托花瓣”的结构。

可执行描述：

- 花被下方有 greenish floral tube / ovary 的膨大连接。
- 花开放前有 papery spathe，开放后常残留在花柄/花头基部。
- 连接点常像一个弯折的绿色颈部，花头从无叶花茎上弯出来。
- 外圈 tepals 的基部围绕 corona/tube，不应出现玫瑰式萼片星托。

DailyFlora primitive 要求：

- 在花背面增加一个小的绿色卵形/筒形 base。
- 可加一片淡褐/浅绿的 papery bract 作为低调识别点。
- 不要在花瓣背后加一圈大绿色萼片。

## 8. 茎和叶从哪里冒出来

真实 Narcissus 多为 bulbiferous geophyte；叶子从基部/球根处冒出，花茎通常是 leafless scape。

可执行描述：

- 茎：一根中空或压扁感的无叶花茎，顶端连接花头。
- 叶：长条、带状、灰绿或蓝绿色，从底部成束长出。
- 花头附近：不应有大量小叶片。
- bouquet 中：可以把带状叶作为独立线材，从下方或中后层穿出，而不是贴在每朵 trumpet-throat 的花头旁。

DailyFlora composition 要求：

- 如果一束里用了 trumpet-throat 作为洋水仙季节方向，叶材应该更像长带状/窄剑叶，不能全部用随机碎叶。
- 叶材应支撑空气和方向，不要托住花头像物理支架。

## 9. 远看轮廓

远看要能读成：六瓣星形 + 中央突出喇叭 / 杯。

正面轮廓：

- 外圈是 6-point soft star。
- 中心是圆形或六边波浪形 cup。
- 中心口沿颜色/明暗比外圈更集中。

侧面轮廓：

- 像一个小 trumpet 从星形背板中心伸出来。
- 花茎与花头有弯折角。
- tepals 可能向后展开或反卷。

小尺寸轮廓：

- 可简化成 `six tepals + raised corona disc + dark center dot`。
- 不要简化成普通五瓣小花。
- 不要简化成一根喇叭。

## 10. 对现有代码的修改方向

现有 `src/floraPrimitives.ts` 已经有 `flaredTrumpetGeometry`，可以作为 corona 几何基础，但 `trumpet-throat-form` 需要完整组合，而不是只做一个 trumpet。

建议新增或强化：

```ts
interface TrumpetThroatOptions extends FloraPrimitiveOptions {
  coronaLengthRatio?: number;
  coronaFlare?: number;
  rimFrill?: number;
  rimColorBias?: number;
  tepalReflex?: number;
  throatDepth?: number;
  stamenVisibility?: number;
  headPitch?: number;
}
```

建议结构：

1. `tepalMesh`: 6 枚 curved / tapered petals，后置，轻微错位。
2. `coronaMesh`: lathe / custom funnel geometry，前置，带内壁深度。
3. `rimMesh` 或 rim points: 不规则波浪口沿，略厚。
4. `stamenGroup`: 4-6 个小 anther + filament，放在 throat 内。
5. `style`: 一条中心细柱，低透明/浅色。
6. `baseGroup`: 背面绿色 ovary / tube / small papery spathe。

优先修正的视觉参数：

- `coronaFlare`: 控制 cup 是短杯还是长喇叭。
- `rimFrill`: 控制水仙口沿识别度。
- `tepalReflex`: 控制花瓣是否向后翻。
- `innerShadow`: 控制 cup 内部深度，不要黑洞。
- `stamenVisibility`: 高精度模式可见，低精度模式简化为中心点。

## 11. 反向验收清单

如果生成结果出现以下情况，说明没有通过 trumpet-throat 参考库：

- 远看像普通雏菊，中心没有 protruding cup。
- 远看像喇叭玩具，外圈六 tepals 消失。
- 远看像百合，六瓣本身组成喇叭，缺少独立 corona。
- 中心是纯空洞，没有 stamen / style / throat depth。
- rim 是完美圆，不像有生命的水仙管心。
- 叶子从花头旁边乱冒，而不是从下方或花茎基部形成带状叶。
- 花头全部正对镜头，像贴图 icon。

## 12. 80 张照片继续收集任务

下一次 Codex 继续本条目时，不要重新定义方向，直接补足样本。

执行顺序：

1. 只收集链接和观察，不下载图片本体，除非明确确认授权和必要性。
2. 优先从 Wikimedia Commons、植物园、大学扩展站、RHS/园艺分类说明、植物学图谱、个人摄影但仅链接引用的网页中补样。
3. 每张样本记录：source URL、license/usage note、view type、observed features、usable insights、avoid notes。
4. 补到 80 张后，把共性结论浓缩到本文件，不要让文档变成纯链接堆。
5. 如果要建立机器可读版本，再新增 `reference-flower-shapes/trumpet-throat-samples.json`。

建议样本字段：

```json
{
  "id": "TT-001",
  "viewType": "front-closeup | side-profile | three-quarter | dissected | plant-habit | cultivar-variation",
  "sourceUrl": "",
  "licenseNote": "link-only / CC0 / CC-BY / unknown",
  "observedFeatures": [
    "six tepals",
    "flared corona",
    "wavy rim",
    "visible stamens",
    "green ovary base"
  ],
  "primitiveInsight": "",
  "avoid": ""
}
```

## 13. 当前一句话结论

`trumpet-throat-form` 的识别锚点不是“喇叭”，而是：**六瓣星形背板 + 独立伸出的 cup/corona + 波浪口沿 + 暗喉部小花药 + 绿色管颈连接**。DailyFlora 应保留生成式抽象，但必须让这五个锚点在中高精度模式下可读。
