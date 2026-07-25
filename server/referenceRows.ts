import type { UserReferenceAssetKind } from './referenceContract.js';

export interface UserReferenceRow {
  record_id: string;
  user_id: string;
  data_environment: 'preview' | 'production';
  storage_provider: 'vercel-blob';
  reference_asset_id: string;
  reference_pathname: string;
  reference_width: number;
  reference_height: number;
  reference_bytes: number;
  thumbnail_asset_id: string;
  thumbnail_pathname: string;
  thumbnail_width: number;
  thumbnail_height: number;
  thumbnail_bytes: number;
  recognition_result: Record<string, unknown> | null;
  palette: string[] | null;
  composition: Record<string, unknown> | null;
  seed: string | null;
  render_params: Record<string, unknown> | null;
  matcher_version: string;
  system_version: string;
  status: 'recognizing' | 'ready' | 'failed';
  failure_code: string | null;
  created_at: string;
  updated_at: string;
}

function assetUrl(recordId: string, kind: UserReferenceAssetKind) {
  return `/api/reference-asset?recordId=${encodeURIComponent(recordId)}&kind=${kind}`;
}

export function publicReferenceRecord(row: UserReferenceRow) {
  return {
    recordId: row.record_id,
    userId: row.user_id,
    dataEnvironment: row.data_environment,
    referenceAsset: {
      assetId: row.reference_asset_id,
      storageProvider: row.storage_provider,
      storageKey: row.reference_pathname,
      mimeType: 'image/webp' as const,
      width: row.reference_width,
      height: row.reference_height,
      bytes: row.reference_bytes,
      accessUrl: assetUrl(row.record_id, 'reference')
    },
    thumbnailAsset: {
      assetId: row.thumbnail_asset_id,
      storageProvider: row.storage_provider,
      storageKey: row.thumbnail_pathname,
      mimeType: 'image/webp' as const,
      width: row.thumbnail_width,
      height: row.thumbnail_height,
      bytes: row.thumbnail_bytes,
      accessUrl: assetUrl(row.record_id, 'thumbnail')
    },
    recognitionResult: row.recognition_result,
    palette: row.palette,
    composition: row.composition,
    seed: row.seed,
    renderParams: row.render_params,
    matcherVersion: row.matcher_version,
    systemVersion: row.system_version,
    status: row.status,
    failureCode: row.failure_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
