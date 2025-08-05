export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountPrice?: number;
  currency: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  level: string;
  duration: number;
  language: string;
  requirements: string[];
  learningOutcomes: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  instructorId: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  categoryId: string;
  category: Category;
  sections?: Section[];
  reviews?: Review[];
  _count: {
    enrollments: number;
    reviews: number;
    sections?: number;
  };
  averageRating?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  _count?: {
    courses: number;
  };
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  videoDuration?: number;
  attachments: string[];
  order: number;
  isFree: boolean;
  sectionId: string;
  progress?: Progress[];
}

export interface Enrollment {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  completedAt?: string;
  certificateUrl?: string;
  userId: string;
  courseId: string;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface Progress {
  id: string;
  isCompleted: boolean;
  completedAt?: string;
  lastAccessedAt: string;
  userId: string;
  lessonId: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripePaymentId?: string;
  stripeSessionId?: string;
  userId: string;
  enrollment?: Enrollment;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certificateId: string;
  issuedAt: string;
  pdfUrl?: string;
  userId: string;
  courseId: string;
  course?: Course;
  user?: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: any;
  status: string;
}