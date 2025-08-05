import Link from 'next/link';
import CourseGrid from '@/components/CourseGrid';
import Hero from '@/components/Hero';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn from industry experts and advance your career with our comprehensive courses
          </p>
        </div>

        <CourseGrid />

        <div className="text-center mt-12">
          <Link
            href="/courses"
            className="btn btn-primary"
          >
            View All Courses
          </Link>
        </div>
      </section>

      <section className="bg-primary-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10,000+</div>
              <div className="text-gray-700">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-700">Expert Instructors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1,000+</div>
              <div className="text-gray-700">Courses Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}