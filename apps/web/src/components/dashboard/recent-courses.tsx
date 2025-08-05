import Link from 'next/link';
import { Enrollment, Course } from '@course-platform/types';

interface RecentCoursesProps {
  enrollments: (Enrollment & { course: Course })[];
}

export function RecentCourses({ enrollments }: RecentCoursesProps) {
  if (enrollments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Recent Courses</h2>
        <p className="text-gray-500">No courses enrolled yet.</p>
        <Link 
          href="/dashboard/browse" 
          className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
        >
          Browse courses →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Recent Courses</h2>
      <div className="space-y-4">
        {enrollments.map((enrollment) => (
          <Link
            key={enrollment.id}
            href={`/dashboard/courses/${enrollment.course.slug}`}
            className="block hover:bg-gray-50 -mx-2 px-2 py-3 rounded transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium">{enrollment.course.title}</h3>
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Progress: {enrollment.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              {enrollment.completed_at && (
                <span className="text-green-600 text-sm">✓ Completed</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}