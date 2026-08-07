import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('member is a real cloud dashboard without demos or embedded homepage', () => {
  const html = read('member/index.html');
  const script = read('src/member.ts');
  assert.doesNotMatch(html + script, /SIMULATED COLLECTION|initialRecords|dailyflora\.member\.records|<iframe/i);
  assert.match(html, /我的收藏/);
  assert.match(html, /我的生成/);
  assert.match(html, /参考图任务/);
  assert.match(html, /账户与积分/);
  assert.match(script, /getMemberSnapshot/);
});

test('formal auth and public bouquet routes exist, obsolete member-test is excluded', () => {
  for (const path of ['signup/index.html', 'login/index.html', 'member/index.html', 'bouquet/index.html', 'admin/index.html']) assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true);
  assert.doesNotMatch(read('vite.config.ts'), /member-test/);
  assert.doesNotMatch(read('scripts/deploy-source-files.json'), /member-test/);
});

test('runtime configuration cannot fall back to production API', () => {
  const config = read('public/dailyflora-config.js');
  const main = read('src/main.ts');
  assert.match(config, /dailyflora-api-beta/);
  assert.doesNotMatch(config, /dailyflora-api['"]/);
  assert.doesNotMatch(main, /当前是离线演示模式|termsVersion: '0\.71\.1'/);
  assert.equal(existsSync(new URL('../public/dailyflora-mock.js', import.meta.url)), false);
  assert.doesNotMatch(read('scripts/deploy-source-files.json'), /dailyflora-mock/);
});

test('homepage heart and menu favorite share the same cloud action', () => {
  const main = read('src/main.ts');
  const homepage = read('index.html');
  assert.match(main, /favoriteButton\?\.addEventListener\('click',[\s\S]*void toggleFavorite\(\)/);
  assert.match(main, /siteMenuFavoriteLink\?\.addEventListener\('click',[\s\S]*void toggleFavorite\(\)/);
  assert.match(main, /await saveCloudFavorite\(nextFavorite\)/);
  assert.match(homepage, /<button class="site-menu-primary" id="site-menu-favorite-link" type="button">/);
  assert.doesNotMatch(homepage, /member-test|member\/#signup/);
  assert.equal((main.match(/siteMenuFavoriteLink\?\.addEventListener\('click'/g) || []).length, 1);
  assert.doesNotMatch(main, /window\.location\.href = '\.\/member\/#saved-title'/);
});

test('language switcher fits the menu and auth entry copy uses i18n', () => {
  const css = read('src/styles.css');
  const homepage = read('index.html');
  const signup = read('signup/index.html');
  const login = read('login/index.html');
  const member = read('member/index.html');
  const translations = read('src/i18n/index.ts');
  assert.match(css, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(css, /site-menu-language-switcher[\s\S]*overflow: hidden/);
  assert.match(homepage, /data-auth-entry="login"/);
  assert.match(homepage, /data-auth-entry="signup"/);
  assert.match(homepage, /data-i18n="common\.signInExisting"/);
  assert.match(homepage, /id="account-profile-link"[^>]+data-i18n="common\.member"/);
  assert.match(signup, /data-i18n="common\.signInExisting"/);
  assert.match(login, /data-i18n="common\.createAccount"/);
  assert.match(member, /data-i18n="common\.signInExisting"/);
  for (const key of ['signInExisting', 'createAccount', 'guestAuthHint']) assert.match(translations, new RegExp(`${key}:`));
});

test('camera failure keeps the actionable startup reason visible', () => {
  const monitor = read('src/hand-control/monitor.ts');
  const tracker = read('src/hand-control/browserHandTracker.ts');
  assert.match(monitor, /trackerStatus === 'error' && currentTrackerMessage/);
  assert.match(tracker, /new URL\('mediapipe\/wasm', baseURI\)/);
  assert.doesNotMatch(tracker, /new URL\('mediapipe\/wasm\/', baseURI\)/);
});

test('provider resource exhaustion is surfaced as an actionable account error', () => {
  const cloud = read('src/dailyfloraCloud.ts');
  assert.match(cloud, /PrePayResourceExhausted/);
  assert.match(cloud, /恢复按量资源后重试/);
});
