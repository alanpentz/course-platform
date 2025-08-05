/**
 * Server-side Supabase client
 * Use this in Server Components, Route Handlers, and Server Actions
 * This module imports next/headers and can only be used on the server
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@course-platform/types';
import { getSupabaseUrl, getSupabaseAnonKey } from './shared';

/**
 * Creates a Supabase client for use in Server Components
 * Automatically handles cookie-based auth
 * @example
 * ```tsx
 * // In a Server Component
 * import { createSupabaseServerClient } from '@course-platform/database/server';
 * 
 * export default async function Page() {
 *   const supabase = createSupabaseServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   // Use supabase client...
 * }
 * ```
 */
export const createSupabaseServerClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};