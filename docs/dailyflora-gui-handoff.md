# DailyFlora GUI Handoff

最后更新：2026-07-18

这份文件记录 DailyFlora 主观看页的 GUI 方向。它只约束普通每日花束界面，不改变产品逻辑、路由、花束生成或 Special Edition。

## 冻结范围

后续 GUI 修改默认不得改变：

- Three.js 花束生成、日期 seed、镜头与渲染逻辑。
- 网站地图、现有 href、路由命名和用户流程。
- 黑色主色调与现有暖黄色强调色。
- 3D 花束作为页面绝对主角的层级。
- Special Edition 的画面、文案、音频、花束数据和路由行为。

## 参考翻译

- `bureaurouge.com`：字体层级、克制、少量信息和安静的工作室气质。
- `21hrs.space`：黑色空间、科幻感、终端式信息语言。
- `depoluxe.xyz/archive/`：节奏、留白、空间与动画出现顺序。
- About 页面只参考空间、层级和克制感；不得复制它的花形品牌图标，也不得把它的 serif/Times 式标题带回主观看页。

## 当前字体方向

主 GUI 试用终端字体方向：

- 本机存在时优先 `Sarasa Term SC`。
- 拉丁与欧洲语言的可靠网页回退为 `Iosevka Charon Mono` medium。
- 中日韩字符的网页回退为 `SarasaUiSC-Regular`。
- 标题使用 medium weight，并做很小的横向扩展与纵向压缩，修正 Sarasa Term 偏瘦、偏高的问题。
- 不再以 Arial Nova、Helvetica Neue、PingFang SC、Noto Sans 等常见系统栈作为设计主字体；它们只可留在最后兼容回退。

## 全局语言

普通每日花束 GUI 支持：

- English `EN`
- 中文 `中`
- Español `ES`
- Français `FR`
- Italiano `IT`
- 日本語 `日`

规则：

- 首次访问默认英文。
- 语言选择保存在 `dailyflora.gui-language.v4`。
- 切换作用于整个 GUI：品牌说明、今日花束标签、INDEX、VIEW、菜单、收藏入口、日期控件、密度/渲染选项、tooltip、title 与 aria-label。
- 中文模式显示已有中文花名；其他语言暂时显示已有英文花名，避免未经审校自动创造西/法/意/日花名。
- 控制条使用短代码与本地化 tooltip，不能因为翻译变长而折成双行。

## 框线与空间

必须保留用户认可的 `Today 6:46 AM` 版本框线：

- 视口内缩的极淡完整矩形线。
- 左上角更清晰的 L 形装饰线。
- 右下角更清晰的 L 形装饰线。
- 不增加第三个装饰角。
- 左下花名区只保留原有信息竖线，不再套额外矩形框。
- 右上 `INDEX` 与右下 `VIEW` 的独立矩形按钮框保留。
- 菜单底部收藏 CTA 不使用包围矩形，只保留黄色文字和上分隔线。

## INDEX 与 VIEW

- INDEX 展开为近乎不透明的右侧抽屉，避免菜单文字和花束几何重叠。
- 菜单打开时压暗花束，并隐藏 HUD / VIEW，不能多层争抢。
- VIEW 展开后所有控件保持单行 `nowrap`；宽度不足时横向滚动，禁止突然变成两行。
- 手机端同样保持单行，不用挤压花束标题。

## 隔离门禁

所有新 GUI 规则必须在 `html.df-gui-v1` 下隔离。Special Edition 路由不得启用该 class；新增语言选择、装饰框和 GUI 字体在 Special Edition 中都必须隐藏，原来的菜单与观看图标保持可用。

## 当前预览与代码

- 独立预览：`https://calfnai.github.io/dailyFlora/ui-v1/`
- 源码分支：`agent/gui-dark-editorial-v1`
- Draft PR：`#16`
- 主要文件：
  - `index.html`
  - `src/gui-v2.js`
  - `src/gui-v5-frame-restore.css`
  - `src/gui-v6-sarasa-i18n-frame.css`
  - `src/gui-v7-font-load.css`

未经用户明确确认，不得将该 Draft PR 合并到 `main`。
