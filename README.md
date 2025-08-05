# Course Platform

A comprehensive online course platform built with modern web technologies. This platform enables instructors to create and sell courses while providing students with a seamless learning experience.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component library
- **React Hook Form** - Form management
- **Tanstack Query** - Data fetching and caching
- **Stripe** - Payment processing

### Backend
- **Fastify** - High-performance Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Database
- **Supabase** - Authentication and real-time features
- **JWT** - Token-based authentication
- **Swagger** - API documentation

### CMS
- **Sanity** - Headless CMS for content management

### Infrastructure
- **Turborepo** - Monorepo management
- **Docker** - Containerization
- **Vercel** - Frontend hosting
- **AWS S3** - Media storage

## 📁 Project Structure

```
course-platform/
├── apps/
│   ├── web/          # Next.js frontend application
│   ├── backend/      # Fastify API server
│   └── cms/          # Sanity CMS studio
├── packages/
│   ├── ui/           # Shared UI components
│   ├── database/     # Prisma schema and client
│   ├── types/        # Shared TypeScript types
│   ├── auth/         # Authentication utilities
│   └── shared/       # Shared utilities
└── docs/             # Documentation
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/course-platform.git
cd course-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/cms/.env.example apps/cms/.env
```

4. Set up the database:
```bash
# Run migrations
cd apps/backend
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

5. Start development servers:
```bash
# From root directory
npm run dev
```

This will start:
- Web app at http://localhost:3000
- API server at http://localhost:8080
- CMS at http://localhost:3333

## 🔑 Features

### For Students
- Browse and search courses
- Watch video lessons
- Track progress
- Download resources
- Earn certificates
- Review courses

### For Instructors
- Create and manage courses
- Upload videos and resources
- View analytics
- Manage students
- Handle course pricing

### For Admins
- User management
- Content moderation
- Platform analytics
- Payment management

## 📊 Database Schema

The platform uses a PostgreSQL database with the following main entities:
- **Users** - Students, instructors, and admins
- **Courses** - Course information and metadata
- **Modules** - Course sections
- **Lessons** - Individual lessons with video content
- **Enrollments** - Student course enrollments
- **Progress** - Lesson completion tracking
- **Reviews** - Course ratings and feedback
- **Payments** - Transaction records
- **Subscriptions** - Recurring payment plans

## 🔐 Authentication

The platform uses Supabase for authentication with support for:
- Email/password login
- OAuth providers (Google, GitHub)
- Magic link authentication
- Role-based access control (RBAC)

## 💳 Payment Integration

Stripe is integrated for:
- One-time course purchases
- Subscription plans
- Payment method management
- Refunds and disputes

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Deploy to Vercel
vercel --prod
```

### Backend (Docker)
```bash
# Build Docker image
docker build -t course-platform-api .

# Run container
docker run -p 8080:8080 course-platform-api
```

### Database (Supabase/PostgreSQL)
- Use Supabase for managed PostgreSQL
- Or deploy your own PostgreSQL instance

## 📝 API Documentation

API documentation is available via Swagger UI at:
```
http://localhost:8080/documentation
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with inspiration from leading online learning platforms
- Thanks to all open-source contributors
- Special thanks to the Stripe, Prisma, and Next.js teams