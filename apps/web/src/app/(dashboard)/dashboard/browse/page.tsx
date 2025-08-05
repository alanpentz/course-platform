import { fetchQuery, coursesQuery, categoriesQuery } from '@course-platform/sanity-client';
import { CourseGrid } from '@/components/courses/course-grid';
import { CategoryFilter } from '@/components/courses/category-filter';
import { SearchBar } from '@/components/courses/search-bar';

export default async function BrowseCoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  // Fetch courses and categories from Sanity
  const [courses, categories] = await Promise.all([
    fetchQuery(coursesQuery),
    fetchQuery(categoriesQuery),
  ]);

  // Filter courses based on search params
  let filteredCourses = courses;

  if (searchParams.category) {
    filteredCourses = filteredCourses.filter(
      course => course.category?.slug === searchParams.category
    );
  }

  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase();
    filteredCourses = filteredCourses.filter(
      course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Courses</h1>
        <p className="text-gray-600">
          Explore our collection of courses and start learning today
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <SearchBar defaultValue={searchParams.search} />
        <CategoryFilter 
          categories={categories} 
          selectedCategory={searchParams.category}
        />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses found matching your criteria.</p>
        </div>
      ) : (
        <CourseGrid courses={filteredCourses} />
      )}
    </div>
  );
}