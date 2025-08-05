import { createSupabaseClient } from '@course-platform/database/client';

export async function checkDatabaseSetup() {
  const supabase = createSupabaseClient();
  
  const tables = [
    'profiles',
    'courses', 
    'lessons',
    'enrollments',
    'lesson_progress',
    'ai_interactions'
  ];
  
  const results: Record<string, boolean> = {};
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      results[table] = !error;
    } catch {
      results[table] = false;
    }
  }
  
  return results;
}

export async function getDatabaseStats() {
  const supabase = createSupabaseClient();
  
  try {
    const [
      { count: profileCount },
      { count: courseCount },
      { count: enrollmentCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true })
    ]);
    
    return {
      profiles: profileCount || 0,
      courses: courseCount || 0,
      enrollments: enrollmentCount || 0
    };
  } catch (error) {
    return {
      profiles: 0,
      courses: 0,
      enrollments: 0
    };
  }
}