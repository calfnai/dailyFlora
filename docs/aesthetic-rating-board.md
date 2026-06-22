# DailyFlora 美学评分看板

最后更新：2026-06-15

此看板用于慢速美学校准。此处新增的来源不会自动更改生成器。只有在所有者评分并明确确认后，才允许把观察转成生成规则。

## 2026-06-15 所有者结论

上一批由 Codex 自行搜索的国外花艺网站，大部分不能作为 DailyFlora 审美来源。

原因：外国花艺审美与中国当代潮流差异很大。中国语境很特殊，日本花艺审美也只有一部分可用，欧美花艺更不能默认迁移。后续不能用“国外 florist portfolio / wedding florist / garden style bouquet”这类来源来代表目标审美。

处理方式：

- 暂停 Codex 自主搜索国外视觉审美来源。
- 已列出的国外视觉候选保留为负样本，不进入生成规则。
- 国外资料最多用于结构/技法参考，例如花束比例、枝条支撑、360 度层次，不用于色彩、潮流、氛围和“好不好看”的判断。
- 新审美来源优先来自用户主动提供的小红书链接。
- 若 Codex 自主找来源，只能找中国当代花艺语境下、无需登录或容易浏览的公开来源，并先进入评分，不自动采纳。

## 评分规则

在 `所有者评分` 栏填写：

- `+2`：非常符合 DailyFlora 方向，可以提炼参数。
- `+1`：部分有用，保留参考。
- `0`：中性，不错但不兴奋。
- `-1`：弱匹配，避免这个方向。
- `-2`：明显不适合，拒绝同类搜索方向。

可选标签：

- `360`：适合转成真实花束体积，不只是平面照片。
- `airy`：星点、花粉、外逸线、轻盈层次有价值。
- `dense`：花叶密度和视觉重心有价值。
- `color`：色彩关系可用。
- `cn-fit`：符合中国当代花艺/小红书语境。
- `foreign-mismatch`：国外审美错位。
- `jp-partial`：日本审美部分可用，但不能整套照搬。
- `bad-scale`：花朵比例太大、太婚礼、太单一主花。
- `too-flat`：只适合平面照片，不适合 360 花束。

## 视觉候选：负样本批次

此批次由 Codex 自主搜索，整体判定为不适合作为目标审美来源。保留它们是为了防止后续重复搜索同类来源。

| ID | 来源 | 当前处理 | 所有者评分 | 所有者备注 |
| --- | --- | --- | --- | --- |
| V01 | [Flora Vita portfolio](https://www.floravitavt.com/wedding-florist-portfolio) | 负样本：国外婚礼/花艺网站，不代表中国当代花束潮流。 | -1 / -2 待细分 | foreign-mismatch |
| V02 | [Strange Vine Studio wedding portfolio](https://www.strangevinestudio.com/weddingflowersportfolio) | 负样本：国外 wedding florist 语境过重。 | -1 / -2 待细分 | foreign-mismatch |
| V03 | [Wild Earth Designs floral portfolio](https://wildearthdesigns.com/wedding-floral-portfolio-photos/) | 负样本：可做“不要这样搜”的训练。 | -1 / -2 待细分 | foreign-mismatch |
| V04 | [Morning Dew garden-style arrangement](https://morningdewflowers.com/product/garden-style-floral-arrangement-moss-container/) | 负样本：可能有结构元素，但审美方向不采纳。 | -1 / -2 待细分 | foreign-mismatch |
| V05 | [Design House lush airy bridal bouquet](https://designhouseofflowers.com/lush-airy-bridal-bouquet.html) | 负样本：bridal bouquet 方向容易偏大花、偏婚礼。 | -1 / -2 待细分 | foreign-mismatch, bad-scale |
| V06 | [Design House garden-style hand-tied bouquet](https://designhouseofflowers.com/garden-style-hand-tied-bouquet.html) | 负样本：hand-tied 技法可参考，审美不采纳。 | -1 / -2 待细分 | foreign-mismatch |
| V07 | [Fierceblooms floral design portfolio](https://fierceblooms.com/floral-design-portfolio/) | 负样本：国外 wild garden style 不等于目标审美。 | -1 / -2 待细分 | foreign-mismatch |
| V08 | [Roots to Blooms floral portfolio](https://rootstoblooms.com/portfolio/) | 负样本：混杂参考，不能作为审美来源。 | -1 / -2 待细分 | foreign-mismatch |

## 结构参考：可保留但降权

以下来源不再参与“好不好看”的判断，只能提取抽象结构方法。若结构方法也导致画面变丑，应直接删除。

| ID | 来源 | 可提取内容 | 禁止提取内容 | 所有者评分 | 所有者备注 |
| --- | --- | --- | --- | --- | --- |
| S01 | [Floret: Making Market Bouquets](https://www.floretflowers.com/making-market-bouquets/) | 花材比例、filler / disk / spike / airy 元素分类。 | 色彩、潮流、整体气质。 |  |  |
| S02 | [Cold Springs Flower Farm: Market Bouquet Recipes](https://www.coldspringsflowerfarm.com/blog/creating-market-bouquet-recipes-our-planning-and-design-process) | 配方化比例。 | 国外市场花束审美。 |  |  |
| S03 | [Mulberry & Moss: Romantic and Airy Floral Installations](https://mulberryandmoss.com/2021/02/02/how-to-create-romantic-amp-airy-floral-installations/) | 多空间层次、不同枝长。 | romantic / wedding 氛围。 |  |  |
| S04 | [Flower Magazine: Foliage for Flower Arrangements](https://flowermag.com/foliage-for-flower-arrangements/) | 叶材作为体积结构。 | 叶色审美和成品风格。 |  |  |
| S05 | [Fiore Designs: Hand-Tied Bouquet](https://fioredesigns.com/journal/care-how-to/hand-tied-bouquet) | spiral hand-tied 结构。 | 手捧花成品审美。 |  |  |
| S06 | [Three Acre Farm: Foliage for Bouquets](https://www.threeacrefarm.net/blog/2020/8/18/foliage-the-secret-to-fabulous-bouquets) | foliage / filler / focal 的功能关系。 | 具体风格。 |  |  |
| S07 | [Homes & Gardens: Hand-tied bouquet method](https://www.homesandgardens.com/living/how-to-create-a-hand-tied-bouquet) | 大小花材层级和多角度检查方法。 | 英式家居花束审美。 |  |  |

## 后续搜索规则

Codex 可以自主找来源，但必须遵守：

1. 优先：中国当代花艺、小红书语境、国内花店/花艺工作室、中文社媒公开页、用户主动给的链接。
2. 谨慎：日本花艺只允许部分参考，必须明确标注 `jp-partial`，不能默认符合中国潮流。
3. 禁止默认采纳：欧美 wedding florist、garden style florist、bridal bouquet、market bouquet、Pinterest 风国外花艺。
4. 不复制图片、不部署原图，只记录链接、观察和可转成粒子 3D 的抽象参数。
5. 新来源先进入评分看板；没有所有者确认，不进入生成器。

如果下一批 Codex 自主找的中国语境来源仍然不合适，则停止自主搜索，只接受用户主动提供的链接。
