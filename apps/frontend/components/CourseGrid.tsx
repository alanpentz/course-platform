'use client';

import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/services/course.service';
import CourseCard from './CourseCard';

export default function CourseGrid({ limit = 8 }: { limit?: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', { limit }],
    queryFn: () => courseService.getCourses({ limit }),
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="bg-gray-300 h-40 rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load courses</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data?.data.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}