import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/blob';
import { ApiError, allowMethods, sendApiError, singleQueryValue } from '../server/http.js';
import { dataEnvironment, isUuid, type UserReferenceAssetKind } from '../server/referenceContract.js';
import type { UserReferenceRow } from '../server/referenceRows.js';
import { assertOwnerOrAdmin, authenticatedUser, getSupabaseAdmin } from '../server/supabase.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return allowMethods(response, ['GET']);

  try {
    const user = await authenticatedUser(request);
    const recordId = singleQueryValue(request.query.recordId);
    const kind = singleQueryValue(request.query.kind) as UserReferenceAssetKind | undefined;
    if (!isUuid(recordId)) throw new ApiError(400, 'recordId must be a UUID.');
    if (kind !== 'reference' && kind !== 'thumbnail') throw new ApiError(400, 'kind must be reference or thumbnail.');

    const { data, error } = await getSupabaseAdmin()
      .from('user_reference_generations')
      .select('*')
      .eq('record_id', recordId)
      .eq('data_environment', dataEnvironment())
      .maybeSingle();
    if (error) throw error;
    const record = data as UserReferenceRow | null;
    if (!record) throw new ApiError(404, 'Reference record not found.');
    assertOwnerOrAdmin(user, record.user_id);

    const pathname = kind === 'reference' ? record.reference_pathname : record.thumbnail_pathname;
    const ifNoneMatch = singleQueryValue(request.headers['if-none-match']);
    const result = await get(pathname, { access: 'private', ifNoneMatch });
    if (!result) throw new ApiError(404, 'Reference asset not found.');
    response.setHeader('Cache-Control', 'private, max-age=300');
    response.setHeader('ETag', result.blob.etag);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (result.statusCode === 304) return response.status(304).end();
    response.setHeader('Content-Type', result.blob.contentType || 'image/webp');
    response.setHeader('Content-Length', String(result.blob.size));
    const reader = result.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      response.write(Buffer.from(value));
    }
    response.end();
  } catch (error) {
    sendApiError(response, error);
  }
}
