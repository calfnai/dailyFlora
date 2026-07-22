import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertExpectedReferencePathname,
  assertNoUserMaterialList,
  configuredRecordLimit,
  dataEnvironment,
  expectedReferenceStorageKeys,
  parseReferenceUploadPayload
} from '../server/referenceContract.ts';

const userId = '11111111-1111-4111-8111-111111111111';
const recordId = '22222222-2222-4222-8222-222222222222';

test('creates provider-neutral storage paths owned by a user and record', () => {
  assert.deepEqual(expectedReferenceStorageKeys(userId, recordId), {
    reference: `users/${userId}/references/${recordId}/reference.webp`,
    thumbnail: `users/${userId}/references/${recordId}/thumbnail.webp`
  });
});

test('upload payload and pathname must match the authenticated owner', () => {
  assert.deepEqual(parseReferenceUploadPayload(JSON.stringify({ recordId, assetKind: 'reference' })), {
    recordId,
    assetKind: 'reference'
  });
  assert.doesNotThrow(() =>
    assertExpectedReferencePathname(
      `users/${userId}/references/${recordId}/reference.webp`,
      userId,
      recordId,
      'reference'
    )
  );
  assert.throws(() =>
    assertExpectedReferencePathname(
      `users/33333333-3333-4333-8333-333333333333/references/${recordId}/reference.webp`,
      userId,
      recordId,
      'reference'
    )
  );
});

test('user records cannot contain copied system flower material lists', () => {
  assert.doesNotThrow(() => assertNoUserMaterialList({ density: 0.8, nested: { openness: 0.5 } }));
  assert.throws(() => assertNoUserMaterialList({ nested: { materialList: ['rose'] } }));
});

test('record quota has safe bounds', () => {
  assert.equal(configuredRecordLimit('25'), 25);
  assert.throws(() => configuredRecordLimit('0'));
  assert.throws(() => configuredRecordLimit('not-a-number'));
});

test('non-production deployments are isolated in the preview data environment', () => {
  assert.equal(dataEnvironment('production'), 'production');
  assert.equal(dataEnvironment('preview'), 'preview');
  assert.equal(dataEnvironment('development'), 'preview');
  assert.equal(dataEnvironment(undefined), 'preview');
});
