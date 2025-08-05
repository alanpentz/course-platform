import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Admin middleware
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard statistics
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentUsers,
      recentEnrollments
    ] = await Promise.all([
      // Total users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      // Total courses by status
      prisma.course.groupBy({
        by: ['status'],
        _count: true
      }),
      // Total enrollments
      prisma.enrollment.count(),
      // Total revenue
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Recent enrollments (last 7 days)
      prisma.enrollment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Revenue by month (last 12 months)
    const revenueByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM "Payment"
      WHERE status = 'COMPLETED'
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `;

    // Popular courses
    const popularCourses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: 5,
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    res.json({
      users: {
        total: totalUsers.reduce((acc, curr) => acc + curr._count, 0),
        byRole: totalUsers.reduce((acc, curr) => {
          acc[curr.role.toLowerCase()] = curr._count;
          return acc;
        }, {} as Record<string, number>),
        recentSignups: recentUsers
      },
      courses: {
        total: totalCourses.reduce((acc, curr) => acc + curr._count, 0),
        byStatus: totalCourses.reduce((acc, curr) => {
          acc[curr.status.toLowerCase()] = curr._count;
          return acc;
        }, {} as Record<string, number>)
      },
      enrollments: {
        total: totalEnrollments,
        recent: recentEnrollments
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        byMonth: revenueByMonth
      },
      popularCourses
    });
  } catch (error) {
    next(error);
  }
});

// User management
router.get('/users', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, role, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              coursesCreated: true,
              enrollments: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
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

// Update user status
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Course management
router.get('/courses', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, status, instructorId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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

    res.json({
      courses,
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

// Update course status
router.patch('/courses/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      throw new AppError(400, 'Invalid status');
    }

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined
      }
    });

    res.json(course);
  } catch (error) {
    next(error);
  }
});

// Category management
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId
      }
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Payment/transaction management
router.get('/payments', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status, userId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          enrollment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
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

export default router;