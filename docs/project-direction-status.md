# DailyFlora 项目方向状态

更新日期：2026-07-19

## 当前继续项

- **GUI**：作为独立方向继续完善，不与其他实验或发布修复混合。
- **写实植物形态**：以 `0b3655c`（`feat: refine realistic flower forms and site labs`）为冻结基线。后续仅在新分支上以明确的形态评审任务继续。

## 保留思路，不再继续或合并

### Android TV

- 保留为未来的封装思路：使用 Capacitor 打包静态网页，并补充电视遥控器的焦点、返回键和默认交互。
- 不保留为当前交付路线；不合并 `android-tv-apk-v1`，不继续构建 APK 或维护其工作流。

### TouchDesigner 风格实验

- 保留为未来视觉探索的参考：独立 WebGL shader 渲染器、确定性的日期 seed 和主题参数、以及 TouchDesigner 网络映射。
- 不采用 TouchDesigner 技术栈；不合并或继续 `dailyflora_TD`。

### Screensaver 原型

- 保留为未来重新开发的起点：全屏花束场景、日期驱动的主题与随机种子、静态网页部署。
- 不以本机 `main` 上的 `5a89780` 作为后续基础，也不将该提交带入整合或发布分支。

## 协作约束

- 每个新对话从 `origin/main` 或已验证的整合分支创建独立 worktree。
- 不在原始工作目录直接开发；不从未推送或历史实验分支派生新工作。
- 只有整合分支可以进入正式 PR 和部署流程。
