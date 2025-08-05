-- Fix script for existing policies
-- This script safely handles already existing policies

-- Drop existing policies if they exist (safe to run multiple times)
DO $$ 
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    
    -- Courses policies
    DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
    DROP POLICY IF EXISTS "Instructors can create courses" ON courses;
    DROP POLICY IF EXISTS "Instructors can update own courses" ON courses;
    DROP POLICY IF EXISTS "Instructors can delete own courses" ON courses;
    
    -- Lessons policies
    DROP POLICY IF EXISTS "Users can view lessons of enrolled courses" ON lessons;
    DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON lessons;
    
    -- Enrollments policies
    DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
    DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
    DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;
    
    -- Lesson progress policies
    DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
    
    -- AI interactions policies
    DROP POLICY IF EXISTS "Users can view own AI interactions" ON ai_interactions;
    DROP POLICY IF EXISTS "Users can create own AI interactions" ON ai_interactions;
END $$;

-- Now recreate all policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = true);

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
    FOR UPDATE USING (
        auth.uid() = instructor_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Instructors can delete own courses" ON courses
    FOR DELETE USING (
        auth.uid() = instructor_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Lessons policies
CREATE POLICY "Users can view lessons of enrolled courses" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = auth.uid()
            AND c.id = lessons.course_id
        ) OR
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = lessons.course_id
            AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can manage lessons of own courses" ON lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = lessons.course_id
            AND instructor_id = auth.uid()
        )
    );

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own enrollments" ON enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments" ON enrollments
    FOR UPDATE USING (user_id = auth.uid());

-- Lesson progress policies
CREATE POLICY "Users can view own progress" ON lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE id = lesson_progress.enrollment_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own progress" ON lesson_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE id = lesson_progress.enrollment_id
            AND user_id = auth.uid()
        )
    );

-- AI interactions policies
CREATE POLICY "Users can view own AI interactions" ON ai_interactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own AI interactions" ON ai_interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());