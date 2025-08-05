import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateSlug } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  shortDescription: z.string().optional(),
  price: z.number().min(0),
  discountPrice: z.number().min(0).optional(),
  categoryId: z.string(),
  level: z.string(),
  language: z.string().default('en'),
  requirements: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

// Get all published courses with filters
router.get('/', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      level,
      search,
      minPrice,
      maxPrice,
      sort = 'newest'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'PUBLISHED'
    };

    if (category) {
      where.categoryId = category;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const orderBy: any = {};
    switch (sort) {
      case 'newest':
        orderBy.publishedAt = 'desc';
        break;
      case 'oldest':
        orderBy.publishedAt = 'asc';
        break;
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      case 'popular':
        orderBy.enrollments = { _count: 'desc' };
        break;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true
            }
          }
        }
      }),
      prisma.course.count({ where })
    ]);

    // Calculate average ratings
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const avgRating = await prisma.review.aggregate({
          where: { courseId: course.id },
          _avg: { rating: true }
        });

        return {
          ...course,
          averageRating: avgRating._avg.rating || 0
        };
      })
    );

    res.json({
      courses: coursesWithRatings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single course with details
router.get('/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true
          }
        },
        category: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                videoDuration: true,
                isFree: true,
                order: true
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      }
    });

    if (!course) {
      throw new AppError(404, 'Course not found');
    }

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true }
    });

    res.json({
      ...course,
      averageRating: avgRating._avg.rating || 0
    });
  } catch (error) {
    next(error);
  }
});

// Create course (instructors only)
router.post(
  '/',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createCourseSchema.parse(req.body);

      const slug = generateSlug(data.title);

      // Check if slug exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug }
      });

      if (existingCourse) {
        throw new AppError(400, 'A course with a similar title already exists');
      }

      const course = await prisma.course.create({
        data: {
          ...data,
          slug,
          instructorId: req.user!.id,
          duration: 0 // Will be calculated based on lessons
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: true
        }
      });

      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  }
);

// Update course (instructor who owns it)
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  async (req: AuthRequest, res, next) => {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id }
      });

      if (!course) {
        throw new AppError(404, 'Course not found');
      }

      if (course.instructorId !== req.user!.id) {
        throw new AppError(403, 'You can only update your own courses');
      }

      const updateData = createCourseSchema.partial().parse(req.body);

      if (updateData.title) {
        updateData.slug = generateSlug(updateData.title);
      }

      const updatedCourse = await prisma.course.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: true
        }
      });

      res.json(updatedCourse);
    } catch (error) {
      next(error);
    }
  }
);

// Publish course
router.post(
  '/:id/publish',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  async (req: AuthRequest, res, next) => {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        include: {
          sections: {
            include: {
              lessons: true
            }
          }
        }
      });

      if (!course) {
        throw new AppError(404, 'Course not found');
      }

      if (course.instructorId !== req.user!.id) {
        throw new AppError(403, 'You can only publish your own courses');
      }

      // Validate course is ready for publishing
      if (course.sections.length === 0) {
        throw new AppError(400, 'Course must have at least one section');
      }

      const hasLessons = course.sections.some(section => section.lessons.length > 0);
      if (!hasLessons) {
        throw new AppError(400, 'Course must have at least one lesson');
      }

      const updatedCourse = await prisma.course.update({
        where: { id: req.params.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      res.json(updatedCourse);
    } catch (error) {
      next(error);
    }
  }
);

// Get instructor's courses
router.get(
  '/instructor/my-courses',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  async (req: AuthRequest, res, next) => {
    try {
      const courses = await prisma.course.findMany({
        where: { instructorId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              sections: true
            }
          }
        }
      });

      res.json(courses);
    } catch (error) {
      next(error);
    }
  }
);

export default router;