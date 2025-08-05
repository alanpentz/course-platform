-- Complete database setup for Course Platform
-- This file combines initial schema and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    thumbnail_url TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    video_url TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_order CHECK (order_index >= 0),
    CONSTRAINT positive_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT unique_order_per_course UNIQUE (course_id, order_index)
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT unique_enrollment UNIQUE (user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_lesson_progress UNIQUE (enrollment_id, lesson_id)
);

-- Create ai_interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cached BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_course ON ai_interactions(course_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate enrollment progress
CREATE OR REPLACE FUNCTION calculate_enrollment_progress(enrollment_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress_percentage DECIMAL(5,2);
BEGIN
    -- Get total lessons for the course
    SELECT COUNT(*)
    INTO total_lessons
    FROM lessons l
    JOIN enrollments e ON e.course_id = l.course_id
    WHERE e.id = enrollment_uuid;

    -- Get completed lessons
    SELECT COUNT(*)
    INTO completed_lessons
    FROM lesson_progress
    WHERE enrollment_id = enrollment_uuid
    AND completed_at IS NOT NULL;

    -- Calculate percentage
    IF total_lessons > 0 THEN
        progress_percentage := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
    ELSE
        progress_percentage := 0;
    END IF;

    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update enrollment progress when lesson is completed
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE enrollments
    SET progress = calculate_enrollment_progress(NEW.enrollment_id),
        completed_at = CASE 
            WHEN calculate_enrollment_progress(NEW.enrollment_id) = 100 
            THEN NOW() 
            ELSE NULL 
        END
    WHERE id = NEW.enrollment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_progress_on_lesson_complete ON lesson_progress;
CREATE TRIGGER update_progress_on_lesson_complete
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress();

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable" ON profiles
    FOR SELECT USING (true);

-- Courses policies
CREATE POLICY "Published courses are public" ON courses
    FOR SELECT USING (is_published = true);

CREATE POLICY "Instructors can view own courses" ON courses
    FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can create courses" ON courses
    FOR INSERT WITH CHECK (
        auth.uid() = instructor_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Instructors can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = instructor_id);

-- Lessons policies
CREATE POLICY "View lessons for enrolled or owned courses" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = lessons.course_id
            AND (
                c.is_published = true OR
                c.instructor_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM enrollments e
                    WHERE e.course_id = c.id
                    AND e.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Instructors can insert lessons" ON lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can update lessons" ON lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can delete lessons" ON lessons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND instructor_id = auth.uid()
        )
    );

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in published courses" ON enrollments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND is_published = true
        )
    );

CREATE POLICY "Instructors can view course enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND instructor_id = auth.uid()
        )
    );

-- Lesson progress policies
CREATE POLICY "Users can view own lesson progress" ON lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE id = enrollment_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own lesson progress" ON lesson_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE id = enrollment_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can modify own lesson progress" ON lesson_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE id = enrollment_id
            AND user_id = auth.uid()
        )
    );

-- AI interactions policies
CREATE POLICY "Users can view own AI interactions" ON ai_interactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create AI interactions" ON ai_interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create helper functions
CREATE OR REPLACE FUNCTION is_enrolled_in_course(course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM enrollments
        WHERE course_id = course_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_course_instructor(course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM courses
        WHERE id = course_uuid
        AND instructor_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify setup
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('profiles', 'courses', 'lessons', 'enrollments', 'lesson_progress', 'ai_interactions');
    
    RAISE NOTICE 'Database setup complete! Created % tables', table_count;
END $$;