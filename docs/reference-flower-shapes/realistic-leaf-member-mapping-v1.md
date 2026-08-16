# DailyFlora 写实花型—叶片成员映射 v1

日期：2026-07-23

状态：三组 Strap 受控映射已定稿并进入验收管线；洋水仙、风信子、狐尾百合的花—叶关系均已通过；飞燕草 Palmate 映射经用户复验否决并撤销，其余未确认成员继续保持 `unresolved + none`。

## 定稿原则

- 已通过的叶片原型只映射给形态关系明确、不会造成明显误导的花型。
- `foliageProfile` 决定叶片拓扑与几何家族；花、茎、叶共用同一个 `PlantStemInstance`。
- 无可靠映射时不生成叶片，不使用通用椭圆叶兜底，也不根据花序外观推断叶型。
- 主花束只从当前实际出现、且拥有确认映射的花茎上受控生成少量叶片；不得为了绿色体量改变花朵计划。
- 偏写实花型 LAB 展示确认叶片，用于检查成员关系；这不等于真实物种扫描模型。

## 已确认映射

| 花型 | 叶片 profile | 叶序 | 当前依据与边界 |
|---|---|---|---|
| 洋水仙 `narcissus` | `confirmed:strap-d2-basal-v1` | `basal` | 水仙为基生、线形至带状叶；D2 用作受控程序化近似。 |
| 风信子 `hyacinth` | `confirmed:strap-d2-basal-v1` | `basal` | 当前花叶搭配 LAB 已通过；D2 表达风信子花序与基生带状叶的受控关系。 |
| 狐尾百合 `foxtail-lily` | `confirmed:strap-d2-basal-v1` | `basal` | 狐尾百合从基部莲座抽生狭长带状叶；当前只表达基生长叶关系。 |

飞燕草 `delphinium` 曾临时映射 `confirmed:palmate-major-envelope-v1`，但该原型源自槭属参考包络，与飞燕草真实掌状深裂叶差异过大。用户于 2026-07-25 复验否决；当前恢复为 `unresolved + none`，不得在主花束或搭配验收页生成该叶型。

参考：

- NC State Extension：[Narcissus](https://plants.ces.ncsu.edu/plants/narcissus/common-name/daffodils/)
- NC State Extension：[Hyacinthus orientalis](https://plants.ces.ncsu.edu/plants/hyacinthus-orientalis/)
- NC State Extension：[Eremurus](https://plants.ces.ncsu.edu/plants/eremurus/)
- NC State Extension：[Delphinium elatum](https://plants.ces.ncsu.edu/plants/delphinium-elatum/)

## 25 个偏写实花型的当前状态

| ID | 花材 | foliageProfile | leafMode | leafArrangement |
|---|---|---|---|---|
| daisy | 雏菊 | unresolved | none | unresolved |
| chamomile | 洋甘菊 | unresolved | none | unresolved |
| gerbera | 非洲菊 | unresolved | none | unresolved |
| sunflower | 太阳花 | unresolved | none | unresolved |
| anemone | 银莲花 | unresolved | none | unresolved |
| cosmos | 波斯菊 | unresolved | none | unresolved |
| dahlia | 大丽花 | unresolved | none | unresolved |
| rose | 玫瑰 | unresolved | none | unresolved |
| ranunculus | 花毛茛 | unresolved | none | unresolved |
| camellia | 山茶 | unresolved | none | unresolved |
| peony | 牡丹 | unresolved | none | unresolved |
| pompon-mum | 乒乓菊 | unresolved | none | unresolved |
| tulip | 郁金香 | unresolved | none | unresolved |
| narcissus | 洋水仙 | confirmed:strap-d2-basal-v1 | attached | basal |
| phalaenopsis | 蝴蝶兰 | unresolved | none | unresolved |
| calla | 马蹄莲 | unresolved | none | unresolved |
| delphinium | 飞燕草 | unresolved | none | unresolved |
| snapdragon | 金鱼草 | unresolved | none | unresolved |
| hyacinth | 风信子 | confirmed:strap-d2-basal-v1 | attached | basal |
| foxtail-lily | 狐尾百合 | confirmed:strap-d2-basal-v1 | attached | basal |
| liatris | 蛇鞭菊 | unresolved | none | unresolved |
| lace-flower | 蕾丝花 | unresolved | none | unresolved |
| hydrangea | 绣球 | unresolved | none | unresolved |
| babys-breath | 满天星 | unresolved | none | unresolved |
| rice-flower | 米花 | unresolved | none | unresolved |

## 主花束接入边界

- 当前主花束类型中，水仙与风信子可实际消费确认的 Strap profile；狐尾百合已完成成员映射，但尚未进入当前主花束的 `FlowerTypeId` 计划。
- 狐尾百合已完成成员映射并在偏写实花型 LAB 中显示；它尚未进入当前主花束的 `FlowerTypeId` 计划，因此本轮不为叶片而改动花朵构图。
- 飞燕草不再消费 Palmate profile；未来必须依据飞燕草自身掌状深裂结构重新研究，不能复用槭属轮廓。
- 叶片使用独立 RNG 命名空间，不插入现有 flower RNG 流。
- 同一花茎只允许一个 profile 和一种叶序；叶片节点必须落在所属茎曲线上。
- 保留的 `temporary-legacy` 独立叶材仍是空间支撑材料，不代表任何写实花型成员。

## 当前结论

Strap 已作为受控叶片原型进入统一叶片—花茎关系，当前定稿映射范围为洋水仙、风信子和狐尾百合；Palmate 独立原型继续保留，但不再映射任何偏写实花型成员。其余 22 个成员保持无叶，等待未来逐种研究。本状态允许三组 Strap 关系进入整体审美与构建，但不等于叶片系统、真实物种叶型或全部成员配置已经完成。
