# DailyFlora Reference Flower Shapes

这个目录只作为 DailyFlora 开发判断花型的参考库，不作为正式渲染素材库。

## 用途

- 帮 Codex、人工开发和审美复盘判断某个 primitive 是否过度抽象。
- 把真实花型照片拆成可执行的几何、朝向、层级和连接规则。
- 为 `src/floraPrimitives.ts`、`src/flowerPlans.ts`、`docs/primitive-lab.html` 的后续修改提供形态依据。

## 非用途

- 不把网上照片或第三方 3D 模型直接复制进正式渲染。
- 不把真实植物图鉴当成 DailyFlora 的最终审美目标。
- 不替代用户验收。

## 参考库工作流

每个花型建立一个独立文件夹或 Markdown 文件，至少包含：

1. 样本范围：目标收集多少张、当前已观察多少张、样本类型。
2. 形态拆解：花瓣轮廓、花心结构、花瓣层级、花头朝向、花萼 / 连接点、茎叶来源、远看轮廓。
3. 生成建议：哪些特征必须进入 primitive，哪些只适合在 composition 层处理。
4. 反向约束：哪些做法会让花型变成几何符号、喇叭、杯子或随机花片。
5. 来源策略：优先使用开放图库、植物学说明页、可引用网页；照片本体默认只链接，不搬运。

## 已开始条目

- [`trumpet-throat-form.md`](./trumpet-throat-form.md) — 洋水仙 / 水仙类 trumpet-throat / corona 管心型参考。
