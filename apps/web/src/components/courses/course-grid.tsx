import Link from 'next/link';
import Image from 'next/image';
import { Course } from '@course-platform/sanity-client';

interface CourseGridProps {
  courses: Course[];
}

export function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/dashboard/courses/${course.slug}`}
      className="group block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-100">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg
              className="w-16 h-16"
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

      <div className="p-6">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {course.instructor.avatar ? (
              <Image
                src={course.instructor.avatar}
                alt={course.instructor.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300" />
            )}
            <span className="text-gray-600">{course.instructor.name}</span>
          </div>

          <div className="flex items-center gap-4">
            {course.duration && (
              <span className="text-gray-500">
                {course.duration}h
              </span>
            )}
            <span className="font-semibold text-indigo-600">
              ${course.price}
            </span>
          </div>
        </div>

        {course.level && (
          <div className="mt-3">
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
              course.level === 'beginner' 
                ? 'bg-green-100 text-green-800'
                : course.level === 'intermediate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {course.level}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}