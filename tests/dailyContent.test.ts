import test from 'node:test';
import assert from 'node:assert/strict';
import { getDailyContentUrls, validateDailyContentManifest } from '../src/dailyContent.ts';

test('daily content accepts a dated GitHub manifest', () => {
  const manifest = validateDailyContentManifest({
    schemaVersion: 1,
    generatedAt: '2026-08-13T00:00:00+08:00',
    source: 'github-repository',
    entries: {
      '2026-08-13': { date: '2026-08-13', seed: 'github-daily-2026-08-13', themeId: 'random' }
    }
  });

  assert.equal(manifest?.entries['2026-08-13'].seed, 'github-daily-2026-08-13');
});

test('daily content rejects a mismatched entry date', () => {
  assert.equal(validateDailyContentManifest({
    schemaVersion: 1,
    generatedAt: '2026-08-13T00:00:00+08:00',
    source: 'github-repository',
    entries: { '2026-08-13': { date: '2026-08-12', seed: 'wrong-date' } }
  }), null);
});

test('configured GitHub sources are tried before built-in fallbacks and are deduplicated', () => {
  const urls = getDailyContentUrls({
    dailyContentUrls: ['https://example.test/daily.json'],
    dailyContentUrl: 'https://example.test/daily.json'
  });

  assert.equal(urls[0], 'https://example.test/daily.json');
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(urls.some((url) => url.includes('raw.githubusercontent.com')), true);
});
