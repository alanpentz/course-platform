import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '../../types/src/database';

export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // For middleware, we use the standard createClient with edge-compatible settings
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          // Pass through auth header if present
          ...(request.headers.get('authorization') && {
            authorization: request.headers.get('authorization')!,
          }),
        },
      },
    }
  );

  return { supabase, response };
}