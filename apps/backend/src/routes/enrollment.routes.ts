import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Get user's enrollments
router.get('/my-courses', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, page = '1', limit = '12' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id
    };

    if (status) {
      where.status = status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
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
                  sections: true
                }
              }
            }
          }
        }
      }),
      prisma.enrollment.count({ where })
    ]);

    res.json({
      enrollments,
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

// Check enrollment status
router.get('/check/:courseId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: req.params.courseId
        }
      }
    });

    res.json({
      isEnrolled: !!enrollment,
      enrollment
    });
  } catch (error) {
    next(error);
  }
});

// Get course progress
router.get('/:courseId/progress', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: req.params.courseId
        }
      }
    });

    if (!enrollment) {
      throw new AppError(403, 'Not enrolled in this course');
    }

    // Get course structure with user progress
    const course = await prisma.course.findUnique({
      where: { id: req.params.courseId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                progress: {
                  where: { userId: req.user!.id }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new AppError(404, 'Course not found');
    }

    // Calculate progress statistics
    let totalLessons = 0;
    let completedLessons = 0;

    course.sections.forEach(section => {
      section.lessons.forEach(lesson => {
        totalLessons++;
        if (lesson.progress.length > 0 && lesson.progress[0].isCompleted) {
          completedLessons++;
        }
      });
    });

    const progressPercent = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    // Update enrollment progress
    if (enrollment.progressPercent !== progressPercent) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { progressPercent }
      });
    }

    res.json({
      enrollment,
      course,
      stats: {
        totalLessons,
        completedLessons,
        progressPercent
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update lesson progress
router.post(
  '/:courseId/lessons/:lessonId/progress',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { courseId, lessonId } = req.params;
      const { isCompleted } = req.body;

      // Check enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId
          }
        }
      });

      if (!enrollment) {
        throw new AppError(403, 'Not enrolled in this course');
      }

      // Update or create progress
      const progress = await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId: req.user!.id,
            lessonId
          }
        },
        update: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date()
        },
        create: {
          userId: req.user!.id,
          lessonId,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      });

      // Check if course is completed
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId: req.user!.id }
                  }
                }
              }
            }
          }
        }
      });

      if (course) {
        let totalLessons = 0;
        let completedLessons = 0;

        course.sections.forEach(section => {
          section.lessons.forEach(lesson => {
            totalLessons++;
            if (lesson.progress.length > 0 && lesson.progress[0].isCompleted) {
              completedLessons++;
            }
          });
        });

        const progressPercent = Math.round((completedLessons / totalLessons) * 100);

        // Update enrollment
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            progressPercent,
            status: progressPercent === 100 ? 'COMPLETED' : 'ACTIVE',
            completedAt: progressPercent === 100 ? new Date() : null
          }
        });

        // Create certificate if completed
        if (progressPercent === 100 && !enrollment.completedAt) {
          await prisma.certificate.create({
            data: {
              userId: req.user!.id,
              courseId
            }
          });
        }
      }

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
);

// Get certificate
router.get('/:courseId/certificate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: req.params.courseId
        }
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!certificate) {
      throw new AppError(404, 'Certificate not found');
    }

    res.json(certificate);
  } catch (error) {
    next(error);
  }
});

export default router;