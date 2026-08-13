# DailyFlora Windows 10/11 桌面版

桌面版把网站的 HTML、Three.js、MediaPipe WASM 和手部模型打进本地安装包，避免每次启动从外网下载这些大资源。每日花内容仍然在线读取：启动后先请求 GitHub 内容清单，成功时使用远程当天 `seed`；GitHub 暂时不可达时使用本地缓存，再退回项目内置的日期生成逻辑。

## 本地运行

```bash
npm run desktop:dev
```

## 构建 Windows 安装包

在 Windows 或 CI 上执行：

```bash
npm run desktop:package:win
```

输出目录为 `desktop/windows/release/`，包括 NSIS 安装包和 portable 版本。桌面版入口会通过 `dailyflora://` 安全本地协议加载，避免 `file://` 页面访问 WASM、Service Worker 和摄像头权限时的兼容问题。

## Windows 屏保参数

- `/s`：全屏屏保模式；键盘、鼠标按键或鼠标移动退出。
- `/p`：控制面板预览兼容模式，打开小窗口，不进入全屏。
- `/c`：配置/普通窗口模式。

真正注册为 Windows `.scr` 屏保前，先用 portable 版本验证 `/s` 与退出行为，再由安装脚本或系统设置指定可执行文件，避免把未验收版本注册为屏保。

## 在线内容与断线观测

运行时配置中的 `dailyContentUrls` 按顺序尝试：GitHub raw 源，然后 GitHub Pages 镜像。当前桌面端会将最近一次成功的清单放入本机缓存，并在 `window.__dailyfloraDailyContentAudit` 与 `document.body.dataset.dailyContentSource` 中记录来源。
