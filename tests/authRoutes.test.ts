import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('signup is a real registration page with a visible login path and no reset controls', () => {
  const html = source('signup/index.html');
  assert.match(html, /<form[^>]+id="auth-form"/);
  assert.match(html, /href="\.\.\/login\/"/);
  assert.doesNotMatch(html, /http-equiv="refresh"|window\.location\.replace/);
  assert.doesNotMatch(html, /forgot-form|reset-form|忘记密码/);
});

test('login owns sign-in, account creation and password recovery', () => {
  const html = source('login/index.html');
  const css = source('src/marketing.css');
  assert.match(html, /<form[^>]+id="auth-form"/);
  assert.match(html, /href="\.\.\/signup\/"/);
  assert.match(html, /href="#forgot"[^>]*data-i18n="auth\.forgotPassword"/);
  assert.match(html, /id="forgot-form"/);
  assert.match(html, /id="reset-form"/);
  assert.doesNotMatch(html, /http-equiv="refresh"|window\.location\.replace/);
  assert.match(css, /\.signup-form\[hidden\] \{ display: none !important; \}/);
});

test('marketing and account pages share one canonical site navigation order', () => {
  const expected = ['common.today', 'common.member', 'common.about', 'common.objects', 'common.platforms', 'common.scifi', 'common.signInExisting', 'common.createAccount'];
  for (const path of ['member/index.html', 'login/index.html', 'signup/index.html', 'about/index.html', 'downloads/index.html', 'bouquet-shop/index.html']) {
    const html = source(path);
    const nav = html.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
    assert.deepEqual([...nav.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]), expected, path);
  }
});

test('member is a protected garden surface rather than an embedded auth page', () => {
  const html = source('member/index.html');
  assert.match(html, /id="member-auth-gate"/);
  assert.match(html, /href="\.\.\/login\/"/);
  assert.match(html, /href="\.\.\/signup\/"/);
  assert.doesNotMatch(html, /member-signup-form|member-reset-request-form|member-reset-form|member-forgot-link/);
});

test('homepage favorite onboarding points to signup while navigation exposes login', () => {
  const html = source('index.html');
  const main = source('src/main.ts');
  assert.match(html, /href="\.\/login\/" data-auth-entry="login"/);
  assert.match(main, /\.\/signup\/\?intent=favorite/);
  assert.doesNotMatch(html, /id="account-guest-actions"/);
  assert.doesNotMatch(html, /id="login-form"/);
});

test('credits always retain a visible source-language fallback', () => {
  const html = source('legal/credits/index.html');
  const runtime = source('src/staticI18n.ts');
  assert.match(html, /<article class="legal-language" lang="en">/);
  assert.match(runtime, /articles\.find\(\(node\) => node\.lang === 'en'\) \|\| articles\[0\]/);
  assert.match(runtime, /node\.hidden = node !== fallback/);
});

test('password reset email returns to the dedicated login route', () => {
  const api = source('dailyflora-cloud/uniCloud-aliyun/cloudfunctions/dailyflora-api/index.js');
  assert.match(api, /\/login\/#reset\?token=/);
  assert.doesNotMatch(api, /\/member\/#reset\?token=/);
});
