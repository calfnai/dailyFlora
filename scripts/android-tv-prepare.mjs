import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const androidRoot = join(process.cwd(), 'android');
const manifestPath = join(androidRoot, 'app/src/main/AndroidManifest.xml');
const variablesPath = join(androidRoot, 'variables.gradle');
const bannerPath = join(androidRoot, 'app/src/main/res/drawable/banner.xml');

function ensureFile(path, description) {
  if (!existsSync(path)) {
    throw new Error(`${description} not found: ${path}. Run \`npx cap add android\` first.`);
  }
}

function insertBeforeApplication(manifest, snippet) {
  if (manifest.includes(snippet.trim().split('\n')[0].trim())) return manifest;
  return manifest.replace(/\s*<application\b/, `\n${snippet}\n    <application`);
}

function addApplicationAttribute(manifest, attrName, attrValue) {
  if (manifest.includes(`${attrName}=`)) return manifest;
  return manifest.replace(/<application\b/, `<application\n        ${attrName}=${JSON.stringify(attrValue)}`);
}

function addMainActivityAttribute(manifest, attrName, attrValue) {
  if (manifest.includes(`${attrName}=`)) return manifest;
  return manifest.replace(/<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/s, `<activity$1\n            ${attrName}=${JSON.stringify(attrValue)}>`);
}

function addLeanbackLauncher(manifest) {
  if (manifest.includes('android.intent.category.LEANBACK_LAUNCHER')) return manifest;
  return manifest.replace(
    /(<category\s+android:name="android\.intent\.category\.LAUNCHER"\s*\/?>)/,
    `$1\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />`
  );
}

function patchManifest() {
  ensureFile(manifestPath, 'Android manifest');
  let manifest = readFileSync(manifestPath, 'utf8');

  const features = `    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.faketouch" android:required="false" />`;

  manifest = insertBeforeApplication(manifest, features);
  manifest = addApplicationAttribute(manifest, 'android:banner', '@drawable/banner');
  manifest = addApplicationAttribute(manifest, 'android:usesCleartextTraffic', 'false');
  manifest = addMainActivityAttribute(manifest, 'android:screenOrientation', 'landscape');
  manifest = addLeanbackLauncher(manifest);

  writeFileSync(manifestPath, manifest);
}

function patchMinSdk() {
  if (!existsSync(variablesPath)) return;
  let content = readFileSync(variablesPath, 'utf8');
  content = content.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
  writeFileSync(variablesPath, content);
}

function writeBanner() {
  mkdirSync(dirname(bannerPath), { recursive: true });
  writeFileSync(
    bannerPath,
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#0B1016" />
    <stroke android:width="2dp" android:color="#FFD865" />
    <corners android:radius="0dp" />
</shape>
`
  );
}

patchManifest();
patchMinSdk();
writeBanner();
console.log('Android TV manifest and launcher resources prepared.');
