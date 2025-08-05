import { createClient } from '@supabase/supabase-js';
import type { Database } from '@course-platform/types';
import { getSupabaseUrl, getSupabaseAnonKey } from './shared';

// Edge-compatible Supabase client
export const createSupabaseEdgeClient = () => {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-edge',
        },
      },
    }
  );
};