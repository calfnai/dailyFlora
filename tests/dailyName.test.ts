import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const specSource = readFileSync(new URL('../src/spec.ts', import.meta.url), 'utf8');

test('neighboring daily bouquet names use unique day marks', () => {
  assert.match(specSource, /\{ cn: '八叶', en: 'eighth-leaf' \}/);
  assert.match(specSource, /\{ cn: '九铃', en: 'ninth-bell' \}/);
  assert.match(specSource, /const mark = dailyNameMark\(spec\.dateLabel\)/);
  assert.match(specSource, /\$\{mood\.cn\}\$\{mark\.cn\}\$\{planName\}/);
});
