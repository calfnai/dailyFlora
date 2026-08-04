import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/userReferenceAssets.ts', import.meta.url), 'utf8');

test('browser image contract matches 0.72 Beta limits', () => {
  assert.match(source, /maxSourceBytes: 20 \* 1024 \* 1024/);
  assert.match(source, /referenceMaxEdge: 2048/);
  assert.match(source, /referenceQuality: 0\.86/);
  assert.match(source, /thumbnailMaxEdge: 320/);
  assert.match(source, /thumbnailQuality: 0\.8/);
  assert.match(source, /maxReferenceBytes: 1_500_000/);
  assert.match(source, /image\/webp/);
});
