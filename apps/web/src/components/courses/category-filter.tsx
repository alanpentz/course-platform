'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';

interface Category {
  _id: string;
  title: string;
  slug: string;
  coursesCount?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (category?: string) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    return params.toString();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`${pathname}?${createQueryString()}`}
        className={clsx(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          !selectedCategory
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        All Courses
      </Link>

      {categories.map((category) => (
        <Link
          key={category._id}
          href={`${pathname}?${createQueryString(category.slug)}`}
          className={clsx(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selectedCategory === category.slug
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {category.title}
          {category.coursesCount !== undefined && (
            <span className="ml-1 text-xs opacity-75">
              ({category.coursesCount})
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}