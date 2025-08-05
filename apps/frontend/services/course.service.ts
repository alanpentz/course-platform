import { apiClient } from '@/lib/api-client';
import { Course, PaginationResponse } from '@/types';

interface CourseFilters {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'popular';
}

interface CourseCreateData {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  categoryId: string;
  level: string;
  language?: string;
  requirements?: string[];
  learningOutcomes?: string[];
  tags?: string[];
}

export const courseService = {
  async getCourses(filters?: CourseFilters): Promise<PaginationResponse<Course>> {
    const response = await apiClient.get<{ courses: Course[]; pagination: any }>('/courses', filters);
    return {
      data: response.courses,
      pagination: response.pagination,
    };
  },

  async getCourse(id: string): Promise<Course> {
    return apiClient.get<Course>(`/courses/${id}`);
  },

  async createCourse(data: CourseCreateData): Promise<Course> {
    return apiClient.post<Course>('/courses', data);
  },

  async updateCourse(id: string, data: Partial<CourseCreateData>): Promise<Course> {
    return apiClient.put<Course>(`/courses/${id}`, data);
  },

  async publishCourse(id: string): Promise<Course> {
    return apiClient.post<Course>(`/courses/${id}/publish`);
  },

  async getInstructorCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>('/courses/instructor/my-courses');
  },
};