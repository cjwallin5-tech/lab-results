import { createBrowserClient } from '@supabase/ssr';
import { requireEnv } from './env';

/**
 * Browser Supabase client — publishable key only. Safe to import anywhere; the
 * secret-key client lives in server.ts and is server-only.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  );
}
