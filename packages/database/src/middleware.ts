/**
 * Middleware helper for Supabase Auth
 * Use this in your Next.js middleware.ts file
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@course-platform/types';
import { getSupabaseUrl, getSupabaseAnonKey } from './shared';

/**
 * Creates a Supabase client for use in Next.js middleware
 * @example
 * ```ts
 * // middleware.ts
 * import { createSupabaseMiddlewareClient } from '@course-platform/database/middleware';
 * 
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createSupabaseMiddlewareClient(request);
 *   const { data: { session } } = await supabase.auth.getSession();
 *   // ... middleware logic
 *   return response;
 * }
 * ```
 */
export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
}