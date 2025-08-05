// Only export client-side functions from this file
export { createSupabaseClient } from './src/client';
export { createSupabaseClient as createSupabaseBrowserClient } from './src/client';
export type { Database } from '../types/src/database';