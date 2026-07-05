import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const androidRoot = join(process.cwd(), 'android');
const manifestPath = join(androidRoot, 'app/src/main/AndroidManifest.xml');
const variablesPath = join(androidRoot, 'variables.gradle');
const bannerPath = join(androidRoot, 'app/src/main/res/drawable/banner.xml');

function readRequired(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} not found: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

function ensureFeature(manifest, featureLine) {
  if (manifest.includes(featureLine)) return manifest;
  return manifest.replace(/\s*<application\b/, `\n    ${featureLine}\n    <application`);
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
  let manifest = readRequired(manifestPath, 'Android manifest');

  manifest = ensureFeature(manifest, '<uses-feature android:name="android.software.leanback" android:required="false" />');
  manifest = ensureFeature(manifest, '<uses-feature android:name="android.hardware.touchscreen" android:required="false" />');
  manifest = ensureFeature(manifest, '<uses-feature android:name="android.hardware.faketouch" android:required="false" />');
  manifest = addApplicationAttribute(manifest, 'android:banner', '@drawable/banner');
  manifest = addMainActivityAttribute(manifest, 'android:screenOrientation', 'landscape');
  manifest = addLeanbackLauncher(manifest);

  writeFileSync(manifestPath, manifest);
}

function patchMinSdk() {
  if (!existsSync(variablesPath)) return;
  const content = readFileSync(variablesPath, 'utf8').replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
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
</shape>
`
  );
}

patchManifest();
patchMinSdk();
writeBanner();
console.log('Android TV manifest and launcher resources prepared.');
