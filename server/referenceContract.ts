import { createUserReferenceStorageKeys, type UserReferenceStorageKeys } from '../src/userReferenceAssets.js';

export const REFERENCE_MAX_BYTES = 6 * 1024 * 1024;
export const THUMBNAIL_MAX_BYTES = 1024 * 1024;
export const USER_REFERENCE_CONTENT_TYPE = 'image/webp';
export const DEFAULT_MAX_RECORDS_PER_USER = 20;
export type UserReferenceDataEnvironment = 'preview' | 'production';

export type UserReferenceAssetKind = 'reference' | 'thumbnail';

export interface ReferenceUploadPayload {
  recordId: string;
  assetKind: UserReferenceAssetKind;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseReferenceUploadPayload(value: string | null): ReferenceUploadPayload {
  if (!value) throw new Error('Missing reference upload payload.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Invalid reference upload payload.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid reference upload payload.');
  const recordId = Reflect.get(parsed, 'recordId');
  const assetKind = Reflect.get(parsed, 'assetKind');
  if (!isUuid(recordId)) throw new Error('recordId must be a UUID.');
  if (assetKind !== 'reference' && assetKind !== 'thumbnail') {
    throw new Error('assetKind must be reference or thumbnail.');
  }
  return { recordId, assetKind };
}

export function expectedReferenceStorageKeys(userId: string, recordId: string): UserReferenceStorageKeys {
  if (!isUuid(userId) || !isUuid(recordId)) throw new Error('User and record IDs must be UUIDs.');
  return createUserReferenceStorageKeys(userId, recordId);
}

export function assertExpectedReferencePathname(
  pathname: string,
  userId: string,
  recordId: string,
  assetKind: UserReferenceAssetKind
) {
  const keys = expectedReferenceStorageKeys(userId, recordId);
  if (pathname !== keys[assetKind]) throw new Error('The requested upload pathname is not authorized.');
}

export function maximumBytesForAsset(assetKind: UserReferenceAssetKind) {
  return assetKind === 'reference' ? REFERENCE_MAX_BYTES : THUMBNAIL_MAX_BYTES;
}

export function configuredRecordLimit(rawValue = process.env.DAILYFLORA_MAX_REFERENCE_RECORDS_PER_USER) {
  if (!rawValue) return DEFAULT_MAX_RECORDS_PER_USER;
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1 || value > 10_000) {
    throw new Error('DAILYFLORA_MAX_REFERENCE_RECORDS_PER_USER must be an integer between 1 and 10000.');
  }
  return value;
}

export function dataEnvironment(rawValue = process.env.DAILYFLORA_DATA_ENVIRONMENT || process.env.VERCEL_ENV): UserReferenceDataEnvironment {
  return rawValue === 'production' ? 'production' : 'preview';
}

const forbiddenUserMaterialKeys = new Set(['materials', 'materialList', 'flowerMaterials', 'flowerList']);

export function assertNoUserMaterialList(value: unknown, path = 'renderParams'): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUserMaterialList(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenUserMaterialKeys.has(key)) {
      throw new Error(`${path}.${key} is forbidden; system flower definitions are not user data.`);
    }
    assertNoUserMaterialList(nested, `${path}.${key}`);
  }
}
