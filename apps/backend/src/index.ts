import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { config } from 'dotenv';
import { authRoutes } from './routes/auth.routes';
import { courseRoutes } from './routes/course.routes';
import { userRoutes } from './routes/user.routes';
import { paymentRoutes } from './routes/payment.routes';
import { enrollmentRoutes } from './routes/enrollment.routes';

config();

const app = Fastify({
  logger: true,
});

async function buildApp() {
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Course Platform API',
        description: 'API documentation for the Course Platform',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      host: 'localhost:8080',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'courses', description: 'Course management endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'payments', description: 'Payment processing endpoints' },
        { name: 'progress', description: 'Learning progress endpoints' },
      ],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(courseRoutes, { prefix: '/api/courses' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(enrollmentRoutes, { prefix: '/api/enrollments' });

  app.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    const port = Number(process.env.PORT) || 8080;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`API Documentation available at http://localhost:${port}/documentation`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();