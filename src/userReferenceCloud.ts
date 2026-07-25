import { upload } from '@vercel/blob/client';
import type {
  StoredUserReferenceWebp,
  UserReferenceComposition,
  UserReferenceGenerationRecord,
  UserReferenceRecognitionResult
} from './extendedTypes';
import {
  createUserReferenceStorageKeys,
  type PreparedUserReferenceAssets,
  type PreparedWebpAsset
} from './userReferenceAssets';

export interface UserReferenceCloudAuth {
  accessToken: string;
  userId: string;
}

export interface UploadUserReferenceInput extends UserReferenceCloudAuth {
  assets: PreparedUserReferenceAssets;
  matcherVersion: string;
  recordId?: string;
  systemVersion: string;
}

export interface CompleteUserReferenceInput extends UserReferenceCloudAuth {
  composition: UserReferenceComposition;
  palette: string[];
  recognitionResult: UserReferenceRecognitionResult;
  recordId: string;
  renderParams: Readonly<Record<string, unknown>>;
  seed: string;
}

function authorizationHeaders(accessToken: string) {
  if (!accessToken) throw new Error('A Supabase access token is required.');
  return { Authorization: `Bearer ${accessToken}` };
}

async function jsonResponse<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  throw new Error(payload?.error || `DailyFlora cloud request failed (${response.status}).`);
}

async function uploadAsset(
  auth: UserReferenceCloudAuth,
  recordId: string,
  kind: 'reference' | 'thumbnail',
  pathname: string,
  asset: PreparedWebpAsset
): Promise<StoredUserReferenceWebp> {
  const blob = await upload(pathname, asset.blob, {
    access: 'private',
    contentType: 'image/webp',
    handleUploadUrl: '/api/reference-uploads',
    headers: authorizationHeaders(auth.accessToken),
    clientPayload: JSON.stringify({ recordId, assetKind: kind })
  });
  if (blob.pathname !== pathname) throw new Error('Vercel Blob returned an unexpected storage pathname.');
  return {
    assetId: `${recordId}:${kind}`,
    storageProvider: 'vercel-blob',
    storageKey: blob.pathname,
    mimeType: 'image/webp',
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes
  };
}

export async function uploadUserReferenceAssets(input: UploadUserReferenceInput) {
  const recordId = input.recordId || crypto.randomUUID();
  const paths = createUserReferenceStorageKeys(input.userId, recordId);
  try {
    const referenceAsset = await uploadAsset(input, recordId, 'reference', paths.reference, input.assets.reference);
    const thumbnailAsset = await uploadAsset(input, recordId, 'thumbnail', paths.thumbnail, input.assets.thumbnail);
    const response = await fetch('/api/reference-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authorizationHeaders(input.accessToken) },
      body: JSON.stringify({
        recordId,
        referenceAsset,
        thumbnailAsset,
        matcherVersion: input.matcherVersion,
        systemVersion: input.systemVersion
      })
    });
    return await jsonResponse<{ record: UserReferenceGenerationRecord }>(response);
  } catch (error) {
    await fetch(`/api/reference-records?recordId=${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
      headers: authorizationHeaders(input.accessToken)
    }).catch(() => undefined);
    throw error;
  }
}

export async function completeUserReferenceRecord(input: CompleteUserReferenceInput) {
  const response = await fetch('/api/reference-records', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders(input.accessToken) },
    body: JSON.stringify({
      recordId: input.recordId,
      status: 'ready',
      recognitionResult: input.recognitionResult,
      palette: input.palette,
      composition: input.composition,
      seed: input.seed,
      renderParams: input.renderParams
    })
  });
  return jsonResponse<{ record: UserReferenceGenerationRecord }>(response);
}

export async function failUserReferenceRecord(auth: UserReferenceCloudAuth, recordId: string, failureCode: string) {
  const response = await fetch('/api/reference-records', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders(auth.accessToken) },
    body: JSON.stringify({ recordId, status: 'failed', failureCode })
  });
  return jsonResponse<{ record: UserReferenceGenerationRecord }>(response);
}

export async function listUserReferenceRecords(auth: UserReferenceCloudAuth) {
  const response = await fetch('/api/reference-records', { headers: authorizationHeaders(auth.accessToken) });
  return jsonResponse<{ records: UserReferenceGenerationRecord[] }>(response);
}

export async function deleteUserReferenceRecord(auth: UserReferenceCloudAuth, recordId: string) {
  const response = await fetch(`/api/reference-records?recordId=${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
    headers: authorizationHeaders(auth.accessToken)
  });
  if (!response.ok) await jsonResponse(response);
}

export async function fetchPrivateReferenceAsset(accessToken: string, recordId: string, kind: 'reference' | 'thumbnail') {
  const response = await fetch(
    `/api/reference-asset?recordId=${encodeURIComponent(recordId)}&kind=${kind}`,
    { headers: authorizationHeaders(accessToken) }
  );
  if (!response.ok) throw new Error(`Could not load the private ${kind} image (${response.status}).`);
  return response.blob();
}
