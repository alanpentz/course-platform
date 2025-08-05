-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Public profiles are viewable by everyone (for instructor info)
CREATE POLICY "Public profiles viewable" ON profiles
    FOR SELECT USING (true);

-- Courses policies
-- Everyone can view published courses
CREATE POLICY "Published courses are public" ON courses
    FOR SELECT USING (is_published = true);

-- Instructors can view their own courses (published or not)
CREATE POLICY "Instructors can view own courses" ON courses
    FOR SELECT USING (
        auth.uid() = instructor_id
    );

-- Instructors can create courses
CREATE POLICY "Instructors can create courses" ON courses
    FOR INSERT WITH CHECK (
        auth.uid() = instructor_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses" ON courses
    FOR UPDATE USING (
        auth.uid() = instructor_id
    );

-- Instructors can delete their own courses
CREATE POLICY "Instructors can delete own courses" ON courses
    FOR DELETE USING (
        auth.uid() = instructor_id
    );

-- Lessons policies
-- Users can view lessons for courses they're enrolled in or courses they instruct
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

-- Instructors can manage lessons for their courses
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
-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (user_id = auth.uid());

-- Users can enroll themselves in published courses
CREATE POLICY "Users can enroll in published courses" ON enrollments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND is_published = true
        )
    );

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view course enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_id
            AND instructor_id = auth.uid()
        )
    );

-- Lesson progress policies
-- Users can view their own progress
CREATE POLICY "Users can view own lesson progress" ON lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE id = enrollment_id
            AND user_id = auth.uid()
        )
    );

-- Users can update their own progress
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
-- Users can view their own AI interactions
CREATE POLICY "Users can view own AI interactions" ON ai_interactions
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own AI interactions
CREATE POLICY "Users can create AI interactions" ON ai_interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create helper functions for common queries
-- Function to check if user is enrolled in a course
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

-- Function to check if user is course instructor
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

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;