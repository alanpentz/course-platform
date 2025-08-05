import { createSupabaseServerClient } from '@course-platform/database/server';
import { fetchQuery, courseBySlugQuery } from '@course-platform/sanity-client';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';

interface CoursePageProps {
  params: {
    slug: string;
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const supabase = createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch course from Sanity
  const sanityData = await fetchQuery(courseBySlugQuery, {
    slug: params.slug,
  });

  if (!sanityData) {
    notFound();
  }

  // Get course from Supabase
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!course) {
    // Create course in Supabase if it doesn't exist
    const { data: newCourse } = await supabase
      .from('courses')
      .insert({
        title: sanityData.title,
        slug: sanityData.slug,
        description: sanityData.description,
      })
      .select()
      .single();
    
    if (!newCourse) {
      notFound();
    }
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course?.id || '')
    .maybeSingle();

  // Get lessons from Supabase if enrolled
  let lessons = [];
  let lessonProgress = [];
  
  if (enrollment) {
    const { data: dbLessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course?.id || '')
      .order('order_index');
    
    lessons = dbLessons || [];

    // Get lesson progress
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollment.id);
    
    lessonProgress = progress || [];
  }

  // Enroll user
  async function enrollUser() {
    'use server';
    
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !course) return;

    // Create enrollment
    await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: course.id,
      });

    // Create lessons in Supabase from Sanity data
    if (sanityData.lessons?.length > 0) {
      const lessonsToInsert = sanityData.lessons.map((lesson: any, index: number) => ({
        course_id: course.id,
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content,
        order_index: index,
        duration_minutes: lesson.videoDuration || 0,
      }));

      await supabase
        .from('lessons')
        .insert(lessonsToInsert);
    }

    redirect(`/dashboard/courses/${params.slug}`);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">{sanityData.title}</h1>
            
            {sanityData.instructor && (
              <div className="flex items-center gap-3 mb-6">
                {sanityData.instructor.avatar && (
                  <Image
                    src={sanityData.instructor.avatar}
                    alt={sanityData.instructor.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{sanityData.instructor.name}</p>
                  <p className="text-sm text-gray-600">{sanityData.instructor.expertise?.join(', ')}</p>
                </div>
              </div>
            )}

            <p className="text-gray-700 mb-6">{sanityData.description}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              {sanityData.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {sanityData.category.title}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {sanityData.level}
                </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {sanityData.duration}
              </span>
              {sanityData.lessons && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {sanityData.lessons.length} lessons
                </span>
              )}
            </div>

            {!enrollment ? (
              <form action={enrollUser}>
                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Enroll Now {sanityData.price > 0 && `- $${sanityData.price}`}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>You're enrolled in this course</span>
                </div>
                
                <div>
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
              </div>
            )}
          </div>

          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {sanityData.thumbnail ? (
              <Image
                src={sanityData.thumbnail}
                alt={sanityData.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <svg
                  className="w-24 h-24"
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
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Learning Objectives */}
          {sanityData.learningObjectives && sanityData.learningObjectives.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">What You'll Learn</h2>
              <ul className="space-y-2">
                {sanityData.learningObjectives.map((objective: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Prerequisites */}
          {sanityData.prerequisites && sanityData.prerequisites.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
              <ul className="space-y-2">
                {sanityData.prerequisites.map((prerequisite: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-gray-400">•</span>
                    <span>{prerequisite}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Lessons */}
          {enrollment && (
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Course Content</h2>
              
              {sanityData.lessons && sanityData.lessons.length > 0 ? (
                <div className="space-y-2">
                  {sanityData.lessons.map((lesson: any, index: number) => {
                    const dbLesson = lessons.find((l: any) => l.slug === lesson.slug);
                    const progress = dbLesson 
                      ? lessonProgress.find((p: any) => p.lesson_id === dbLesson.id)
                      : null;
                    const isCompleted = progress?.completed_at;
                    
                    return (
                      <Link
                        key={lesson._key}
                        href={`/dashboard/courses/${params.slug}/lessons/${lesson.slug}`}
                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{lesson.title}</h3>
                          {lesson.videoDuration && (
                            <p className="text-sm text-gray-600">{lesson.videoDuration} min</p>
                          )}
                        </div>
                        
                        {progress && !isCompleted && progress.progress > 0 && (
                          <div className="w-16">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No lessons available yet.</p>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Instructor Bio */}
          {sanityData.instructor && sanityData.instructor.bio && (
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold mb-4">About the Instructor</h3>
              <div className="space-y-4">
                {sanityData.instructor.avatar && (
                  <Image
                    src={sanityData.instructor.avatar}
                    alt={sanityData.instructor.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                )}
                <div>
                  <h4 className="font-medium">{sanityData.instructor.name}</h4>
                  <div className="text-sm text-gray-600 mt-2">
                    <PortableText value={sanityData.instructor.bio} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Course Info */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Course Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Duration</dt>
                <dd className="font-medium">{sanityData.duration}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Level</dt>
                <dd className="font-medium capitalize">{sanityData.level}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Lessons</dt>
                <dd className="font-medium">{sanityData.lessons?.length || 0} lessons</dd>
              </div>
              {sanityData.category && (
                <div>
                  <dt className="text-sm text-gray-600">Category</dt>
                  <dd className="font-medium">{sanityData.category.title}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}