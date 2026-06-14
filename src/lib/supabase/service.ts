import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Create a service-role Supabase client that bypasses RLS.
 * Use ONLY in server actions/server components where RLS
 * would otherwise block superadmin operations.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not configured"
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
