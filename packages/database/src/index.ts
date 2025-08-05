// Main exports - these are safe for both client and server
export * from './auth';

// Re-export types
export type { Database } from '@course-platform/types';

// Note: Import client or server specific modules directly:
// import { createSupabaseClient } from '@course-platform/database/client';
// import { createSupabaseServerClient } from '@course-platform/database/server';