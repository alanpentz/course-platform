'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Course } from '@/types';
import { Star } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const displayPrice = course.discountPrice || course.price;
  const hasDiscount = course.discountPrice && course.discountPrice < course.price;

  return (
    <Link href={`/courses/${course.id}`} className="block">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-40 bg-gray-200">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {course.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2">
            {course.instructor.firstName} {course.instructor.lastName}
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium ml-1">
                {course.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({course._count.reviews} reviews)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600">
              ${displayPrice}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${course.price}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}