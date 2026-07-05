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
- `scripts/android-tv-build.mjs` - builds the web app, creates/syncs the Android platform, optionally builds the APK.
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

## Known limitations

This first APK version is only a packaging baseline. It may install and render, but it still needs TV-specific UX testing:

- Remote-control focus behavior.
- Performance on low-memory TV hardware.
- Idle / burn-in behavior for long display sessions.
- Whether animation quality should be lowered by default on TV.
- Whether a dedicated TV route should hide mobile controls and use bigger typography.

## Recommended next step

After the first APK artifact installs successfully, add a dedicated TV mode such as `?device=tv` or `/tv/`. That mode should simplify UI, enlarge text, reduce interaction dependency, and expose only TV-safe controls.
