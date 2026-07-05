# DailyFlora Android TV APK build

Status: experimental branch `android-tv-apk-v1`.

This version packages the existing Vite + Three.js DailyFlora web app into an Android TV installable APK through Capacitor. It does not replace the current web/GitHub Pages version.

## Target device

Baseline target: Android TV / Google TV devices sold around 2021.

Practical target:

- Android 7.0 / API 24 or later.
- Android System WebView / Chrome WebView available and reasonably up to date.
- Landscape TV display.
- Remote-control-first usage; touch is not required.

## Why Capacitor

DailyFlora is already a static Vite app. Capacitor lets the existing `dist/` build run inside an Android WebView with a native Android wrapper. This keeps the visual engine, daily seed behavior, and Three.js code on the same code path as the web version.

## Files added in this branch

- `capacitor.config.json` - points Capacitor to the Vite `dist/` output.
- `src/tvMode.ts` - adds a TV-only remote-control interaction layer.
- `scripts/android-tv-build.mjs` - builds the web app, injects TV defaults, creates/syncs the Android platform, optionally builds the APK.
- `scripts/android-tv-prepare.mjs` - patches the generated Android project for TV installability.
- `.github/workflows/android-tv-apk.yml` - builds a downloadable debug APK artifact from GitHub Actions.

## TV-specific manifest patch

The preparation script patches the generated Android manifest with:

- `android.intent.category.LEANBACK_LAUNCHER` so the app appears in Android TV launchers.
- `android.software.leanback` feature declaration.
- `android.hardware.touchscreen` set to `required="false"`.
- `android.hardware.faketouch` set to `required="false"`.
- landscape screen orientation.
- a basic TV banner drawable.
- `minSdkVersion = 24` in the generated Android variables file.

## TV interaction behavior

The Android TV build injects:

```js
window.__DAILYFLORA_DEVICE__ = 'tv'
```

It also adds `device=tv` and defaults to `render=low` when the URL has no explicit render choice. This avoids a 2021 TV entering the high render profile just because the TV reports a large screen.

In TV mode:

- HUD and viewing controls stay visible; the auto-hide class is overridden.
- The control panel is pinned open.
- A large TV focus ring is added.
- A remote hint is shown on screen.
- Arrow keys move between controls.
- OK / Enter activates the focused control.
- Left / right adjusts the rotation speed slider when it is focused.
- Up / down jumps focus by larger steps, or adjusts the slider when the slider is focused.
- Escape closes the current top layer, such as menu or calendar.

Known remote-control assumptions:

- Most Android TV remotes map D-pad to browser `Arrow*` key events.
- The OK button normally maps to `Enter`.
- Some TV brands map Back outside the web layer; this still needs real-device testing after APK installation.

## Local build

```bash
npm install
npm run android:tv:apk
```

The debug APK should be generated under:

```text
android/app/build/outputs/apk/debug/
```

## GitHub Actions build

The workflow can be run manually from GitHub Actions on the `android-tv-apk-v1` branch.

Output artifact:

```text
dailyflora-tv-debug-apk
```

## Codex one-shot prompt

Use this as the first message in a new Codex conversation:

```text
Clone and build the DailyFlora Android TV APK branch.

Repository: https://github.com/calfnai/dailyFlora
Branch: android-tv-apk-v1

Steps:
1. Clone the repository and checkout android-tv-apk-v1.
2. Run npm install.
3. Run npm run android:tv:apk.
4. If the build fails, inspect the error, fix only the Android TV packaging/build issue, and rerun the command.
5. Confirm the final APK path, expected to be android/app/build/outputs/apk/debug/app-debug.apk.
6. Summarize whether the TV mode loads src/tvMode.ts and whether dist/index.html receives the TV bootstrap marker.

Do not redesign the flower scene. Keep changes scoped to Android TV packaging, build, and remote-control interaction.
```

## Known limitations

This first APK version is still a packaging and interaction baseline. It needs real-device checks for:

- Whether the remote Back key reaches the web page.
- Performance on low-memory TV hardware.
- Idle / burn-in behavior for long display sessions.
- Whether the default TV render quality should stay `low` or be raised to `medium`.

## Recommended next step

After the first APK artifact installs successfully, add a more deliberate TV route such as `/tv/`. That mode can remove non-TV features, simplify UI, and tune animation/performance for long-running living-room display.
