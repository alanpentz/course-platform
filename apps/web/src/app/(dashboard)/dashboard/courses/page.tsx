import { createSupabaseServerClient } from '@course-platform/database/server';
import { fetchQuery, courseBySlugQuery } from '@course-platform/sanity-client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function MyCoursesPage() {
  const supabase = createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user's enrollments from Supabase
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch course details from Sanity for each enrollment
  const coursesWithDetails = await Promise.all(
    (enrollments || []).map(async (enrollment) => {
      try {
        const sanityData = await fetchQuery(courseBySlugQuery, {
          slug: enrollment.course.slug,
        });
        return {
          ...enrollment,
          sanityData,
        };
      } catch {
        // If Sanity data not found, use Supabase data
        return {
          ...enrollment,
          sanityData: null,
        };
      }
    })
  );

  const activeCourses = coursesWithDetails.filter(e => !e.completed_at);
  const completedCourses = coursesWithDetails.filter(e => e.completed_at);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Courses</h1>
        <div className="flex gap-4 text-sm">
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            {activeCourses.length} Active
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full">
            {completedCourses.length} Completed
          </div>
        </div>
      </div>

      {coursesWithDetails.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-500 mb-4">You haven&apos;t enrolled in any courses yet.</p>
          <Link
            href="/dashboard/browse"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeCourses.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
              <div className="grid gap-4">
                {activeCourses.map((enrollment) => (
                  <CourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </section>
          )}

          {completedCourses.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Completed Courses</h2>
              <div className="grid gap-4">
                {completedCourses.map((enrollment) => (
                  <CourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ enrollment }: { enrollment: any }) {
  const course = enrollment.sanityData || enrollment.course;
  const thumbnail = enrollment.sanityData?.thumbnail || null;
  const instructor = enrollment.sanityData?.instructor || null;

  return (
    <Link
      href={`/dashboard/courses/${enrollment.course.slug}`}
      className="flex gap-6 p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="w-48 h-32 relative flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1">{course.title}</h3>
        {instructor && (
          <p className="text-sm text-gray-600 mb-3">by {instructor.name}</p>
        )}
        
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{enrollment.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </div>

        {enrollment.completed_at ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Completed on {new Date(enrollment.completed_at).toLocaleDateString()}</span>
          </div>
        ) : (
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Continue Learning →
          </button>
        )}
      </div>
    </Link>
  );
}