import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';
import { ApiError, allowMethods, sendApiError } from '../server/http.js';
import { authenticatedUser, getSupabaseAdmin, isSuperAdmin } from '../server/supabase.js';
import { dataEnvironment } from '../server/referenceContract.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return allowMethods(response, ['GET']);
  try {
    const user = await authenticatedUser(request);
    if (!isSuperAdmin(user)) throw new ApiError(403, 'Super-admin access is required.');

    let cursor: string | undefined;
    let blobCount = 0;
    let blobBytes = 0;
    do {
      const page = await list({ cursor, limit: 1000, prefix: 'users/' });
      blobCount += page.blobs.length;
      blobBytes += page.blobs.reduce((sum, blob) => sum + blob.size, 0);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const { count, error } = await getSupabaseAdmin()
      .from('user_reference_generations')
      .select('record_id', { count: 'exact', head: true })
      .eq('data_environment', dataEnvironment());
    if (error) throw error;
    response.status(200).json({
      records: count || 0,
      dataEnvironment: dataEnvironment(),
      blobs: blobCount,
      bytes: blobBytes,
      hobbyStorageBytes: 1024 ** 3,
      storageFraction: blobBytes / 1024 ** 3,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    sendApiError(response, error);
  }
}
