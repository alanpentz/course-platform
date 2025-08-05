import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/src/database';

export function createSupabaseEdgeClient() {
  // For edge runtime, we use the standard createClient
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}