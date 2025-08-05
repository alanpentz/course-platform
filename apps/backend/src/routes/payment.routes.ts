import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Create checkout session
router.post('/create-checkout-session', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      throw new AppError(400, 'Course ID is required');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      throw new AppError(400, 'Already enrolled in this course');
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!course) {
      throw new AppError(404, 'Course not found');
    }

    if (course.status !== 'PUBLISHED') {
      throw new AppError(400, 'Course is not available for enrollment');
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id
        }
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: course.currency.toLowerCase(),
            product_data: {
              name: course.title,
              description: course.shortDescription || course.description.substring(0, 100),
              images: course.thumbnail ? [course.thumbnail] : [],
              metadata: {
                courseId: course.id
              }
            },
            unit_amount: Math.round((course.discountPrice || course.price) * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/courses/${course.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/courses/${course.id}`,
      metadata: {
        userId: user.id,
        courseId: course.id
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
});

// Handle successful payment
router.post('/confirm-payment', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new AppError(400, 'Session ID is required');
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (session.payment_status !== 'paid') {
      throw new AppError(400, 'Payment not completed');
    }

    const { userId, courseId } = session.metadata as {
      userId: string;
      courseId: string;
    };

    // Verify user matches
    if (userId !== req.user!.id) {
      throw new AppError(403, 'Unauthorized');
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.json({
        enrollment: existingEnrollment,
        message: 'Already enrolled'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: session.amount_total! / 100,
        currency: session.currency!.toUpperCase(),
        status: 'COMPLETED',
        stripeSessionId: session.id,
        stripePaymentId: (session.payment_intent as Stripe.PaymentIntent)?.id,
        paymentMethod: session.payment_method_types[0],
        userId
      }
    });

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        paymentId: payment.id
      },
      include: {
        course: true
      }
    });

    res.json({
      enrollment,
      message: 'Enrollment successful'
    });
  } catch (error) {
    next(error);
  }
});

// Webhook endpoint for Stripe
router.post('/webhook', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status === 'paid') {
          const { userId, courseId } = session.metadata as {
            userId: string;
            courseId: string;
          };

          // Check if enrollment already exists
          const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId,
                courseId
              }
            }
          });

          if (!existingEnrollment) {
            // Create payment record
            const payment = await prisma.payment.create({
              data: {
                amount: session.amount_total! / 100,
                currency: session.currency!.toUpperCase(),
                status: 'COMPLETED',
                stripeSessionId: session.id,
                stripePaymentId: (session.payment_intent as string),
                paymentMethod: session.payment_method_types[0],
                userId
              }
            });

            // Create enrollment
            await prisma.enrollment.create({
              data: {
                userId,
                courseId,
                paymentId: payment.id
              }
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment record if exists
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'FAILED' }
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true
              }
            }
          }
        }
      }
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
});

export default router;