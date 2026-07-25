import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del, head } from '@vercel/blob';
import { ApiError, allowMethods, bodyObject, sendApiError, singleQueryValue } from '../server/http.js';
import {
  assertExpectedReferencePathname,
  assertNoUserMaterialList,
  configuredRecordLimit,
  dataEnvironment,
  expectedReferenceStorageKeys,
  isUuid,
  maximumBytesForAsset,
  USER_REFERENCE_CONTENT_TYPE,
  type UserReferenceAssetKind
} from '../server/referenceContract.js';
import { publicReferenceRecord, type UserReferenceRow } from '../server/referenceRows.js';
import { assertOwnerOrAdmin, authenticatedUser, getSupabaseAdmin, isSuperAdmin } from '../server/supabase.js';

interface SubmittedAsset {
  assetId: string;
  storageKey: string;
  width: number;
  height: number;
  bytes: number;
}

function requiredString(body: Record<string, unknown>, key: string, maxLength = 200) {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new ApiError(400, `${key} must be a non-empty string no longer than ${maxLength} characters.`);
  }
  return value.trim();
}

function submittedAsset(body: Record<string, unknown>, key: string): SubmittedAsset {
  const value = body[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, `${key} is required.`);
  const asset = value as Record<string, unknown>;
  const assetId = requiredString(asset, 'assetId');
  const storageKey = requiredString(asset, 'storageKey', 500);
  const width = asset.width;
  const height = asset.height;
  const bytes = asset.bytes;
  if (![width, height, bytes].every((item) => Number.isSafeInteger(item) && Number(item) > 0)) {
    throw new ApiError(400, `${key} dimensions and bytes must be positive integers.`);
  }
  return { assetId, storageKey, width: Number(width), height: Number(height), bytes: Number(bytes) };
}

async function verifyStoredAsset(asset: SubmittedAsset, kind: UserReferenceAssetKind) {
  if (asset.bytes > maximumBytesForAsset(kind)) throw new ApiError(413, `${kind} exceeds its storage limit.`);
  let stored;
  try {
    stored = await head(asset.storageKey);
  } catch {
    throw new ApiError(400, `${kind} was not found in the configured private Blob store.`);
  }
  if (stored.pathname !== asset.storageKey || stored.contentType !== USER_REFERENCE_CONTENT_TYPE) {
    throw new ApiError(400, `${kind} must be a private WebP at the authorized pathname.`);
  }
  if (stored.size !== asset.bytes) throw new ApiError(409, `${kind} metadata does not match the uploaded Blob.`);
}

async function getRecord(recordId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_reference_generations')
    .select('*')
    .eq('record_id', recordId)
    .eq('data_environment', dataEnvironment())
    .maybeSingle();
  if (error) throw error;
  return data as UserReferenceRow | null;
}

async function createRecord(request: VercelRequest, response: VercelResponse) {
  const user = await authenticatedUser(request);
  const body = bodyObject(request);
  const recordId = requiredString(body, 'recordId');
  if (!isUuid(recordId)) throw new ApiError(400, 'recordId must be a UUID.');
  const reference = submittedAsset(body, 'referenceAsset');
  const thumbnail = submittedAsset(body, 'thumbnailAsset');
  assertExpectedReferencePathname(reference.storageKey, user.id, recordId, 'reference');
  assertExpectedReferencePathname(thumbnail.storageKey, user.id, recordId, 'thumbnail');

  const admin = getSupabaseAdmin();
  const { count, error: countError } = await admin
    .from('user_reference_generations')
    .select('record_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('data_environment', dataEnvironment());
  if (countError) throw countError;
  if ((count || 0) >= configuredRecordLimit()) {
    throw new ApiError(429, 'Your reference-image record limit has been reached. Delete an older record before creating another.');
  }

  await Promise.all([verifyStoredAsset(reference, 'reference'), verifyStoredAsset(thumbnail, 'thumbnail')]);
  const matcherVersion = requiredString(body, 'matcherVersion', 100);
  const systemVersion = requiredString(body, 'systemVersion', 100);
  const { data, error } = await admin
    .from('user_reference_generations')
    .insert({
      record_id: recordId,
      user_id: user.id,
      data_environment: dataEnvironment(),
      storage_provider: 'vercel-blob',
      reference_asset_id: reference.assetId,
      reference_pathname: reference.storageKey,
      reference_width: reference.width,
      reference_height: reference.height,
      reference_bytes: reference.bytes,
      thumbnail_asset_id: thumbnail.assetId,
      thumbnail_pathname: thumbnail.storageKey,
      thumbnail_width: thumbnail.width,
      thumbnail_height: thumbnail.height,
      thumbnail_bytes: thumbnail.bytes,
      matcher_version: matcherVersion,
      system_version: systemVersion,
      status: 'recognizing'
    })
    .select('*')
    .single();
  if (error?.code === '23505') throw new ApiError(409, 'This reference record already exists.');
  if (error) throw error;
  response.status(201).json({ record: publicReferenceRecord(data as UserReferenceRow) });
}

async function listRecords(request: VercelRequest, response: VercelResponse) {
  const user = await authenticatedUser(request);
  const requestedUserId = singleQueryValue(request.query.userId);
  let query = getSupabaseAdmin()
    .from('user_reference_generations')
    .select('*')
    .order('created_at', { ascending: false })
    .eq('data_environment', dataEnvironment())
    .limit(100);
  if (requestedUserId) {
    if (!isUuid(requestedUserId)) throw new ApiError(400, 'userId must be a UUID.');
    assertOwnerOrAdmin(user, requestedUserId);
    query = query.eq('user_id', requestedUserId);
  } else if (!isSuperAdmin(user)) {
    query = query.eq('user_id', user.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  response.status(200).json({ records: (data as UserReferenceRow[]).map(publicReferenceRecord) });
}

async function updateRecord(request: VercelRequest, response: VercelResponse) {
  const user = await authenticatedUser(request);
  const body = bodyObject(request);
  const recordId = requiredString(body, 'recordId');
  if (!isUuid(recordId)) throw new ApiError(400, 'recordId must be a UUID.');
  const existing = await getRecord(recordId);
  if (!existing) throw new ApiError(404, 'Reference record not found.');
  assertOwnerOrAdmin(user, existing.user_id);
  if (existing.status !== 'recognizing') throw new ApiError(409, 'Only recognizing records can be finalized.');

  const status = body.status;
  let update: Record<string, unknown>;
  if (status === 'ready') {
    const recognitionResult = body.recognitionResult;
    const palette = body.palette;
    const composition = body.composition;
    const renderParams = body.renderParams;
    if (!recognitionResult || typeof recognitionResult !== 'object' || Array.isArray(recognitionResult)) {
      throw new ApiError(400, 'recognitionResult is required for a ready record.');
    }
    if (!Array.isArray(palette) || palette.some((color) => typeof color !== 'string') || palette.length > 32) {
      throw new ApiError(400, 'palette must be an array of at most 32 color strings.');
    }
    if (!composition || typeof composition !== 'object' || Array.isArray(composition)) {
      throw new ApiError(400, 'composition is required for a ready record.');
    }
    if (!renderParams || typeof renderParams !== 'object' || Array.isArray(renderParams)) {
      throw new ApiError(400, 'renderParams is required for a ready record.');
    }
    assertNoUserMaterialList(renderParams);
    update = {
      status: 'ready',
      recognition_result: recognitionResult,
      palette,
      composition,
      seed: requiredString(body, 'seed', 500),
      render_params: renderParams,
      failure_code: null
    };
  } else if (status === 'failed') {
    update = { status: 'failed', failure_code: requiredString(body, 'failureCode', 100) };
  } else {
    throw new ApiError(400, 'status must be ready or failed.');
  }

  const { data, error } = await getSupabaseAdmin()
    .from('user_reference_generations')
    .update(update)
    .eq('record_id', recordId)
    .eq('status', 'recognizing')
    .select('*')
    .single();
  if (error) throw error;
  response.status(200).json({ record: publicReferenceRecord(data as UserReferenceRow) });
}

async function deleteRecord(request: VercelRequest, response: VercelResponse) {
  const user = await authenticatedUser(request);
  const recordId = singleQueryValue(request.query.recordId);
  if (!isUuid(recordId)) throw new ApiError(400, 'recordId must be a UUID.');
  const existing = await getRecord(recordId);
  if (existing) assertOwnerOrAdmin(user, existing.user_id);
  const keys = existing
    ? { reference: existing.reference_pathname, thumbnail: existing.thumbnail_pathname }
    : expectedReferenceStorageKeys(user.id, recordId);
  await del([keys.reference, keys.thumbnail]);
  if (existing) {
    const { error } = await getSupabaseAdmin().from('user_reference_generations').delete().eq('record_id', recordId);
    if (error) throw error;
  }
  response.status(204).end();
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    if (request.method === 'POST') return await createRecord(request, response);
    if (request.method === 'GET') return await listRecords(request, response);
    if (request.method === 'PATCH') return await updateRecord(request, response);
    if (request.method === 'DELETE') return await deleteRecord(request, response);
    return allowMethods(response, ['GET', 'POST', 'PATCH', 'DELETE']);
  } catch (error) {
    sendApiError(response, error);
  }
}
