# Supabase Database Setup

This directory contains the SQL migrations and seed data for the course platform database.

## Database Schema

The database includes the following tables:

### Core Tables
- **profiles** - User profiles with roles (student, instructor, admin)
- **courses** - Course information including pricing and publishing status
- **lessons** - Individual lessons within courses
- **enrollments** - Student enrollments in courses
- **lesson_progress** - Tracks completion of individual lessons
- **ai_interactions** - Stores AI chat history for analytics

### Key Features
- Row Level Security (RLS) policies for data protection
- Automatic progress calculation
- Trigger-based updated_at timestamps
- Optimized indexes for performance

## Running Migrations

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each file in order:
   - `20240103_initial_schema.sql`
   - `20240103_rls_policies.sql`
   - `seed.sql` (optional, for test data)

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref chxykpbzdujtkcnkfhtn
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Option 3: Direct Connection

Using the connection string from your Supabase dashboard:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.chxykpbzdujtkcnkfhtn.supabase.co:5432/postgres" -f migrations/20240103_initial_schema.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.chxykpbzdujtkcnkfhtn.supabase.co:5432/postgres" -f migrations/20240103_rls_policies.sql
```

## Seeding Test Data

Before running the seed file:

1. Create test users through Supabase Auth dashboard or using the JavaScript client
2. Update the UUIDs in `seed.sql` with the actual user IDs
3. Run the seed file

## Database Diagram

```
profiles (1) ----< (∞) courses
    |                     |
    |                     |
    v                     v
enrollments (∞) >---- (1) lessons
    |                     |
    |                     |
    v                     v
lesson_progress ---------> 

ai_interactions (∞) -----> (1) profiles
```

## RLS Policies Summary

- **Students** can:
  - View published courses
  - Enroll in courses
  - Track their own progress
  - View their AI interactions

- **Instructors** can:
  - Create and manage their own courses
  - View enrollments for their courses
  - All student permissions

- **Admins** have:
  - Full access to all resources (future implementation)

## Important Notes

1. The database uses UUID for all IDs
2. All timestamps are stored in UTC
3. Progress is automatically calculated via triggers
4. Email validation is enforced at the database level
5. Prices are stored as DECIMAL(10,2) for accuracy

## Troubleshooting

If you encounter permission errors:
1. Ensure RLS is enabled on all tables
2. Check that policies are created correctly
3. Verify your auth token includes the correct user ID

For performance issues:
1. Check that all indexes are created
2. Monitor slow queries in Supabase dashboard
3. Consider adding additional indexes based on usage patterns