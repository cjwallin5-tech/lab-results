import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

/**
 * Admin Supabase client — uses the secret key, which bypasses RLS. The 'server-only'
 * import above makes any attempt to pull this into a client component a build error.
 * (Plain Node scripts like scripts/seed.ts can't import this either — they construct
 * their own admin client with the same env names.)
 */
export function createSupabaseAdminClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
