import { createClient, type User } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';
import { ApiError, bearerToken } from './http.js';

function requiredEnvironment(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing required environment variable: ${names.join(' or ')}.`);
}

function supabaseUrl() {
  return requiredEnvironment(['SUPABASE_URL']);
}

function anonKey() {
  return requiredEnvironment(['SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY']);
}

export function getSupabaseAdmin() {
  return createClient(supabaseUrl(), requiredEnvironment(['SUPABASE_SERVICE_ROLE_KEY']), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function authenticatedUser(request: VercelRequest) {
  const token = bearerToken(request);
  const client = createClient(supabaseUrl(), anonKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, 'The Supabase session is invalid or expired.');
  return data.user;
}

export function isSuperAdmin(user: User) {
  const role = user.app_metadata?.role;
  const roles = user.app_metadata?.roles;
  if (role === 'super_admin' || (Array.isArray(roles) && roles.includes('super_admin'))) return true;
  const configuredIds = (process.env.DAILYFLORA_ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configuredIds.includes(user.id);
}

export function assertOwnerOrAdmin(user: User, ownerUserId: string) {
  if (user.id !== ownerUserId && !isSuperAdmin(user)) {
    throw new ApiError(403, 'You cannot access another user’s reference assets.');
  }
}
