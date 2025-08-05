import type { Database } from './database';

export type Course = Database['public']['Tables']['courses']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];

export interface CourseWithLessons extends Course {
  lessons: Lesson[];
}

export interface CourseWithProgress extends Course {
  enrollment?: Enrollment;
  totalLessons: number;
  completedLessons: number;
}

export interface LessonWithProgress extends Lesson {
  isCompleted: boolean;
  completedAt?: string;
}