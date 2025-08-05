/**
 * Client-side Supabase client
 * Use this in Client Components, API routes, or any client-side code
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@course-platform/types';
import { getSupabaseUrl, getSupabaseAnonKey } from './shared';

let clientInstance: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Creates or returns a singleton Supabase client for use in Client Components
 * @example
 * ```tsx
 * // In a Client Component
 * 'use client';
 * 
 * import { createSupabaseClient } from '@course-platform/database/client';
 * 
 * export function MyComponent() {
 *   const supabase = createSupabaseClient();
 *   // Use supabase client...
 * }
 * ```
 */
export const createSupabaseClient = () => {
  if (clientInstance) {
    return clientInstance;
  }

  clientInstance = createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return clientInstance;
};