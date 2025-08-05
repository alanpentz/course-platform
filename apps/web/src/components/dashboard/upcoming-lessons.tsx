import { createSupabaseServerClient } from '@course-platform/database/server';
import Link from 'next/link';

interface UpcomingLessonsProps {
  userId: string;
}

export async function UpcomingLessons({ userId }: UpcomingLessonsProps) {
  const supabase = createSupabaseServerClient();

  // Get next lessons to complete
  const { data: upcomingLessons } = await supabase
    .from('lessons')
    .select(`
      *,
      course:courses(*),
      lesson_progress!inner(*)
    `)
    .eq('lesson_progress.completed_at', null)
    .order('order_index', { ascending: true })
    .limit(5);

  if (!upcomingLessons || upcomingLessons.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Upcoming Lessons</h2>
        <p className="text-gray-500">No upcoming lessons.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Upcoming Lessons</h2>
      <div className="space-y-3">
        {upcomingLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition"
          >
            <div className="flex-1">
              <h4 className="font-medium">{lesson.title}</h4>
              <p className="text-sm text-gray-600">{lesson.course?.title}</p>
              {lesson.duration_minutes && (
                <p className="text-xs text-gray-500 mt-1">
                  {lesson.duration_minutes} minutes
                </p>
              )}
            </div>
            <Link
              href={`/dashboard/courses/${lesson.course?.slug}/lessons/${lesson.id}`}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Start →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}