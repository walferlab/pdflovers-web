// ⚠️  SERVER-ONLY — never import in client components.
// The service-role key bypasses all RLS policies.
// Used exclusively in API route handlers for trusted DB writes (e.g. recording sales).

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  // auth.persistSession: false — no session needed for server-side admin calls
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
