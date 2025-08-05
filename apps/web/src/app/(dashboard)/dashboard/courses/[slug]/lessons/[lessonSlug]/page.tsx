import { createSupabaseServerClient } from '@course-platform/database/server';
import { fetchQuery, courseBySlugQuery } from '@course-platform/sanity-client';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRenderer } from '@course-platform/mdx-components';
import { AIChat, AIExplainer, AICodeReview } from '@course-platform/mdx-components/ai';
import LessonNavigation from './LessonNavigation';
import VideoPlayer from './VideoPlayer';

interface LessonPageProps {
  params: {
    slug: string;
    lessonSlug: string;
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const supabase = createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get course from Supabase
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!course) {
    notFound();
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single();

  if (!enrollment) {
    redirect(`/dashboard/courses/${params.slug}`);
  }

  // Get lesson from Supabase
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .eq('slug', params.lessonSlug)
    .single();

  if (!lesson) {
    notFound();
  }

  // Get all lessons for navigation
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index');

  // Get lesson progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lesson.id)
    .single();

  // Fetch Sanity data for rich content
  const sanityData = await fetchQuery(courseBySlugQuery, {
    slug: params.slug,
  });

  const sanityLesson = sanityData?.lessons?.find(
    (l: any) => l.slug === params.lessonSlug
  );

  // Process MDX content if available
  let mdxSource = null;
  if (sanityLesson?.mdxContent) {
    mdxSource = await serialize(sanityLesson.mdxContent, {
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
      },
    });
  }

  // Update progress
  async function updateProgress(progressPercent: number) {
    'use server';
    
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !enrollment || !lesson) return;

    if (progress) {
      await supabase
        .from('lesson_progress')
        .update({
          progress: progressPercent,
          last_position: Math.floor((progressPercent / 100) * (lesson.duration_minutes * 60)),
          completed_at: progressPercent === 100 ? new Date().toISOString() : null,
        })
        .eq('id', progress.id);
    } else {
      await supabase
        .from('lesson_progress')
        .insert({
          enrollment_id: enrollment.id,
          lesson_id: lesson.id,
          progress: progressPercent,
          last_position: Math.floor((progressPercent / 100) * (lesson.duration_minutes * 60)),
          completed_at: progressPercent === 100 ? new Date().toISOString() : null,
        });
    }
  }

  // Mark as complete
  async function markComplete() {
    'use server';
    await updateProgress(100);
    
    // Redirect to next lesson if available
    const currentIndex = allLessons?.findIndex(l => l.id === lesson.id) || 0;
    const nextLesson = allLessons?.[currentIndex + 1];
    
    if (nextLesson) {
      redirect(`/dashboard/courses/${params.slug}/lessons/${nextLesson.slug}`);
    } else {
      redirect(`/dashboard/courses/${params.slug}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/dashboard/courses" className="text-gray-500 hover:text-gray-700">
              My Courses
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href={`/dashboard/courses/${params.slug}`} className="text-gray-500 hover:text-gray-700">
              {course.title}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{lesson.title}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          {sanityLesson?.videoUrl && (
            <VideoPlayer
              videoUrl={sanityLesson.videoUrl}
              initialPosition={progress?.last_position || 0}
              onProgress={updateProgress}
            />
          )}

          {/* Lesson Content */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>
            
            {mdxSource ? (
              <div className="prose prose-lg max-w-none">
                <MDXRenderer 
                  source={mdxSource}
                  components={{
                    // Pass context to AI components
                    AIChat: (props: any) => (
                      <AIChat
                        {...props}
                        lessonId={lesson.id}
                        courseId={course.id}
                        context={`Lesson: ${lesson.title}\nCourse: ${course.title}`}
                      />
                    ),
                    AIExplainer: (props: any) => (
                      <AIExplainer
                        {...props}
                        lessonId={lesson.id}
                        courseId={course.id}
                      />
                    ),
                    AICodeReview: (props: any) => (
                      <AICodeReview
                        {...props}
                        lessonId={lesson.id}
                        courseId={course.id}
                      />
                    ),
                  }}
                />
              </div>
            ) : sanityLesson?.content ? (
              <div className="prose prose-lg max-w-none">
                <PortableText
                  value={sanityLesson.content}
                  components={{
                    block: {
                      normal: ({ children }) => <p className="mb-4">{children}</p>,
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
                    },
                    marks: {
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
                      ),
                    },
                    types: {
                      code: ({ value }) => (
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                          <code className={`language-${value.language || 'plaintext'}`}>
                            {value.code}
                          </code>
                        </pre>
                      ),
                      callout: ({ value }) => (
                        <div className={`p-4 rounded-lg mb-4 ${
                          value.type === 'info' ? 'bg-blue-50 border-blue-200' :
                          value.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          value.type === 'error' ? 'bg-red-50 border-red-200' :
                          'bg-green-50 border-green-200'
                        } border`}>
                          <p className="font-medium mb-1">{value.title}</p>
                          <p>{value.text}</p>
                        </div>
                      ),
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-gray-600">
                <p>{lesson.content || 'No content available for this lesson yet.'}</p>
              </div>
            )}

            {/* Resources */}
            {sanityLesson?.resources && sanityLesson.resources.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-lg font-semibold mb-4">Resources</h2>
                <div className="space-y-2">
                  {sanityLesson.resources.map((resource: any) => (
                    <a
                      key={resource._key}
                      href={resource.url}
                      download
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">{resource.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Button */}
            <div className="mt-8 pt-8 border-t">
              {progress?.completed_at ? (
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Lesson completed</span>
                </div>
              ) : (
                <form action={markComplete}>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Mark as Complete & Continue
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Lesson Navigation */}
        <div className="lg:col-span-1">
          <LessonNavigation
            lessons={allLessons || []}
            currentLessonId={lesson.id}
            enrollmentId={enrollment.id}
            courseSlug={params.slug}
          />
        </div>
      </div>
    </div>
  );
}