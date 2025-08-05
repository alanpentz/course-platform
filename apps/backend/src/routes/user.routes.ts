import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const updateSchema = z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      bio: z.string().max(500).optional(),
      avatar: z.string().url().optional()
    });

    const data = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        emailVerified: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Upload avatar
router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file provided');
      }

      // In production, upload to S3 or similar service
      // For now, we'll just return a mock URL
      const avatarUrl = `/uploads/avatars/${req.user!.id}-${Date.now()}.jpg`;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          avatar: true
        }
      });

      res.json({ avatar: user.avatar });
    } catch (error) {
      next(error);
    }
  }
);

// Get instructor profile
router.get('/instructors/:id', async (req, res, next) => {
  try {
    const instructor = await prisma.user.findUnique({
      where: {
        id: req.params.id,
        role: 'INSTRUCTOR'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            coursesCreated: {
              where: {
                status: 'PUBLISHED'
              }
            }
          }
        }
      }
    });

    if (!instructor) {
      throw new AppError(404, 'Instructor not found');
    }

    // Get total students and reviews
    const stats = await prisma.enrollment.aggregate({
      where: {
        course: {
          instructorId: instructor.id,
          status: 'PUBLISHED'
        }
      },
      _count: true
    });

    const reviews = await prisma.review.aggregate({
      where: {
        course: {
          instructorId: instructor.id
        }
      },
      _avg: {
        rating: true
      },
      _count: true
    });

    res.json({
      ...instructor,
      stats: {
        coursesCount: instructor._count.coursesCreated,
        studentsCount: stats._count,
        averageRating: reviews._avg.rating || 0,
        reviewsCount: reviews._count
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get instructor's courses
router.get('/instructors/:id/courses', async (req, res, next) => {
  try {
    const { page = '1', limit = '12' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      instructorId: req.params.id,
      status: 'PUBLISHED' as const
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' },
        include: {
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

    // Get average ratings
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

// Submit course review
router.post(
  '/courses/:courseId/reviews',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { rating, comment } = z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional()
      }).parse(req.body);

      // Check if enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: req.params.courseId
          }
        }
      });

      if (!enrollment) {
        throw new AppError(403, 'You must be enrolled to review this course');
      }

      // Check if already reviewed
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: req.params.courseId
          }
        }
      });

      if (existingReview) {
        throw new AppError(400, 'You have already reviewed this course');
      }

      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          userId: req.user!.id,
          courseId: req.params.courseId
        },
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
      });

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }
);

// Update review
router.put(
  '/courses/:courseId/reviews',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { rating, comment } = z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional()
      }).parse(req.body);

      const review = await prisma.review.update({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: req.params.courseId
          }
        },
        data: {
          rating,
          comment
        },
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
      });

      res.json(review);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's review for a course
router.get(
  '/courses/:courseId/my-review',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const review = await prisma.review.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: req.params.courseId
          }
        },
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
      });

      res.json(review);
    } catch (error) {
      next(error);
    }
  }
);

export default router;