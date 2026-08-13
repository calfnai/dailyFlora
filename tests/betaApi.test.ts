import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../dailyflora-cloud/uniCloud-aliyun/cloudfunctions/dailyflora-api-beta/index.js', import.meta.url), 'utf8');

test('beta API uses only beta collections and storage prefix', () => {
  for (const name of ['users', 'sessions', 'favorites', 'generations', 'tasks', 'refs', 'point-accounts', 'points-ledger', 'gardens', 'resets']) {
    assert.match(source, new RegExp(`dailyflora-beta-${name}`));
  }
  assert.match(source, /dailyflora\/beta-072\/private\/\$\{auth\.user\._id\}/);
  assert.doesNotMatch(source, /db\.collection\('uni-id-users'\)/);
});

test('task charging, idempotency and refund are server side', () => {
  assert.match(source, /const TASK_COST = 10/);
  assert.match(source, /idempotencyKey/);
  assert.match(source, /where\.balance = command\.gte\(Math\.abs\(amount\)\)/);
  assert.match(source, /operations\.\$\{operationKey\}/);
  assert.match(source, /DF-BETA-DEBIT/);
  assert.match(source, /DF-BETA-REFUND/);
  assert.match(source, /if \(!task\.charged \|\| task\.refundedAt\) return false/);
});

test('public generation endpoint returns an explicit public projection', () => {
  assert.match(source, /getPublicGeneration/);
  assert.match(source, /generation: \{ id: value\.id, publicId: value\.publicId, name: value\.name/);
  const projection = source.slice(source.indexOf('async function publicGenerationById'), source.indexOf('async function sendResetEmail'));
  assert.doesNotMatch(projection, /email|referenceFileId|thumbnailFileId|point/);
});
