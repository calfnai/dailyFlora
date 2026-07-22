import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ApiError, allowMethods, sendApiError } from '../server/http.js';
import { authenticatedUser, getSupabaseAdmin } from '../server/supabase.js';
import {
  assertExpectedReferencePathname,
  configuredRecordLimit,
  dataEnvironment,
  maximumBytesForAsset,
  parseReferenceUploadPayload,
  USER_REFERENCE_CONTENT_TYPE
} from '../server/referenceContract.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return allowMethods(response, ['POST']);

  try {
    const body = request.body as HandleUploadBody;
    const user = body?.type === 'blob.generate-client-token' ? await authenticatedUser(request) : null;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        if (!user) throw new ApiError(401, 'Authenticated upload token request required.');
        if (multipart) throw new ApiError(400, 'Multipart uploads are not allowed for DailyFlora reference images.');
        let payload;
        try {
          payload = parseReferenceUploadPayload(clientPayload);
          assertExpectedReferencePathname(pathname, user.id, payload.recordId, payload.assetKind);
        } catch {
          throw new ApiError(403, 'The requested upload pathname is not authorized.');
        }
        const { count, error } = await getSupabaseAdmin()
          .from('user_reference_generations')
          .select('record_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('data_environment', dataEnvironment());
        if (error) throw error;
        if ((count || 0) >= configuredRecordLimit()) {
          throw new ApiError(429, 'Your reference-image record limit has been reached.');
        }
        return {
          allowedContentTypes: [USER_REFERENCE_CONTENT_TYPE],
          maximumSizeInBytes: maximumBytesForAsset(payload.assetKind),
          validUntil: Date.now() + 5 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ userId: user.id, ...payload })
        };
      }
    });
    response.status(200).json(result);
  } catch (error) {
    sendApiError(response, error);
  }
}
