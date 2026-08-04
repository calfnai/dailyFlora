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
});
