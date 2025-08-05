'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@course-platform/database/client';

interface LessonNavigationProps {
  lessons: any[];
  currentLessonId: string;
  enrollmentId: string;
  courseSlug: string;
}

export default function LessonNavigation({
  lessons,
  currentLessonId,
  enrollmentId,
  courseSlug,
}: LessonNavigationProps) {
  const [progress, setProgress] = useState<Record<string, any>>({});
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Fetch progress for all lessons
    async function fetchProgress() {
      const { data } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentId);

      if (data) {
        const progressMap = data.reduce((acc, p) => ({
          ...acc,
          [p.lesson_id]: p,
        }), {});
        setProgress(progressMap);
      }
    }

    fetchProgress();

    // Subscribe to progress updates
    const subscription = supabase
      .channel('lesson-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_progress',
          filter: `enrollment_id=eq.${enrollmentId}`,
        },
        (payload: any) => {
          if (payload.new && 'lesson_id' in payload.new) {
            setProgress(prev => ({
              ...prev,
              [payload.new.lesson_id]: payload.new,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enrollmentId, supabase]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Course Content</h2>
      
      <div className="space-y-1">
        {lessons.map((lesson, index) => {
          const lessonProgress = progress[lesson.id];
          const isCompleted = lessonProgress?.completed_at;
          const isCurrent = lesson.id === currentLessonId;
          
          return (
            <Link
              key={lesson.id}
              href={`/dashboard/courses/${courseSlug}/lessons/${lesson.slug}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                isCompleted
                  ? 'bg-green-100 text-green-600'
                  : isCurrent
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-400'
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
                  <span className="font-medium">{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isCurrent ? 'font-medium' : ''}`}>
                  {lesson.title}
                </p>
                {lesson.duration_minutes > 0 && (
                  <p className="text-xs text-gray-500">
                    {lesson.duration_minutes} min
                  </p>
                )}
              </div>
              
              {lessonProgress && !isCompleted && lessonProgress.progress > 0 && (
                <div className="w-12">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-indigo-600 h-1 rounded-full"
                      style={{ width: `${lessonProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}