import type { VercelRequest, VercelResponse } from '@vercel/node';

export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function allowMethods(response: VercelResponse, methods: string[]) {
  response.setHeader('Allow', methods.join(', '));
  response.status(405).json({ error: 'Method not allowed.' });
}

export function bearerToken(request: VercelRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'A Supabase access token is required.');
  const token = header.slice('Bearer '.length).trim();
  if (!token) throw new ApiError(401, 'A Supabase access token is required.');
  return token;
}

export function bodyObject(request: VercelRequest): Record<string, unknown> {
  let body: unknown = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      throw new ApiError(400, 'Request body must be valid JSON.');
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

export function singleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function sendApiError(response: VercelResponse, error: unknown) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'Internal server error.' });
}
