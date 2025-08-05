# @course-platform/database

Supabase client package for the Course Platform monorepo. This package provides separate client and server implementations to work with Next.js 14 App Router.

## Installation

This package is already included in the monorepo. No separate installation needed.

## Usage

### Client Components

Use the client version in Client Components, hooks, and browser-side code:

```tsx
'use client';

import { createSupabaseClient } from '@course-platform/database/client';

export function MyClientComponent() {
  const supabase = createSupabaseClient();
  
  const handleClick = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*');
  };
  
  return <button onClick={handleClick}>Load Courses</button>;
}
```

### Server Components

Use the server version in Server Components, Route Handlers, and Server Actions:

```tsx
import { createSupabaseServerClient } from '@course-platform/database/server';

export default async function Page() {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', user?.id);
  
  return <div>{/* Render courses */}</div>;
}
```

### Route Handlers (API Routes)

```tsx
// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@course-platform/database/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ courses });
}
```

### Server Actions

```tsx
'use server';

import { createSupabaseServerClient } from '@course-platform/database/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.get('fullName') as string,
    })
    .eq('id', user.id);
  
  if (error) throw error;
  
  revalidatePath('/dashboard/profile');
}
```

### Auth Functions

The auth functions are available from the main export and work in both client and server contexts:

```tsx
import { signIn, signUp, signOut } from '@course-platform/database';

// In a Client Component
async function handleLogin(email: string, password: string) {
  try {
    await signIn(email, password);
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

## Architecture

- `src/client.ts` - Client-side Supabase client (browser-safe)
- `src/server.ts` - Server-side Supabase client (uses Next.js cookies)
- `src/auth.ts` - Authentication utilities (uses client internally)
- `src/shared.ts` - Shared configuration
- `src/index.ts` - Main exports (auth functions only)

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## TypeScript

This package re-exports the `Database` type from `@course-platform/types` for convenience:

```tsx
import type { Database } from '@course-platform/database';
```