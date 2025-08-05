import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail_url?: string;
    price: number;
    instructor: {
      id: string;
      full_name?: string;
      avatar_url?: string;
    };
    _count?: {
      enrollments: number;
    };
  };
  enrolled?: boolean;
  progress?: number;
}

export function CourseCard({ course, enrolled = false, progress }: CourseCardProps) {
  return (
    <Link href={`/dashboard/courses/${course.slug}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              width={400}
              height={225}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {course.title}
          </h3>
          
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {course.description}
          </p>
          
          <div className="mt-3 flex items-center">
            {course.instructor.avatar_url ? (
              <Image
                src={course.instructor.avatar_url}
                alt={course.instructor.full_name || 'Instructor'}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full" />
            )}
            <span className="ml-2 text-sm text-gray-600">
              {course.instructor.full_name || 'Instructor'}
            </span>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            {enrolled ? (
              <>
                <div className="flex-1 mr-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-1">
                    {progress || 0}% complete
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  Continue
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
                {course._count && (
                  <span className="text-sm text-gray-600">
                    {course._count.enrollments} students
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}