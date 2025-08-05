-- Seed data for development and testing
-- Note: This assumes you have already created some users through Supabase Auth

-- Insert sample profiles (you'll need to replace these UUIDs with actual user IDs from auth.users)
-- Example: After creating users via Supabase dashboard or auth API, update these IDs

/*
-- Sample instructor profile
INSERT INTO profiles (id, email, full_name, role, avatar_url)
VALUES 
    ('instructor-uuid-here', 'instructor@example.com', 'Dr. Jane Smith', 'instructor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'),
    ('student-uuid-here', 'student@example.com', 'John Doe', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John');

-- Sample courses
INSERT INTO courses (id, title, description, slug, instructor_id, thumbnail_url, price, is_published)
VALUES 
    (
        uuid_generate_v4(),
        'Introduction to Machine Learning',
        'Learn the fundamentals of machine learning with hands-on projects and real-world applications.',
        'intro-to-machine-learning',
        'instructor-uuid-here',
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
        99.99,
        true
    ),
    (
        uuid_generate_v4(),
        'Advanced React Development',
        'Master React hooks, performance optimization, and advanced patterns for building scalable applications.',
        'advanced-react-development',
        'instructor-uuid-here',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
        149.99,
        true
    ),
    (
        uuid_generate_v4(),
        'Full-Stack Web Development',
        'Build modern web applications from scratch using Next.js, TypeScript, and Supabase.',
        'full-stack-web-development',
        'instructor-uuid-here',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        199.99,
        false
    );

-- Sample lessons for the first course
WITH ml_course AS (
    SELECT id FROM courses WHERE slug = 'intro-to-machine-learning'
)
INSERT INTO lessons (course_id, title, description, content, order_index, duration_minutes, video_url)
SELECT 
    ml_course.id,
    lesson.title,
    lesson.description,
    lesson.content,
    lesson.order_index,
    lesson.duration_minutes,
    lesson.video_url
FROM ml_course,
(VALUES
    (
        'Introduction to ML Concepts',
        'Understanding the basics of machine learning and its applications',
        '# Introduction to Machine Learning\n\nMachine learning is a subset of artificial intelligence...',
        0,
        15,
        'https://example.com/videos/ml-intro'
    ),
    (
        'Setting Up Your Environment',
        'Installing Python, Jupyter, and essential ML libraries',
        '# Environment Setup\n\nIn this lesson, we will set up our development environment...',
        1,
        20,
        'https://example.com/videos/ml-setup'
    ),
    (
        'Your First ML Model',
        'Building a simple linear regression model',
        '# Building Your First Model\n\nLet''s create our first machine learning model...',
        2,
        30,
        'https://example.com/videos/ml-first-model'
    ),
    (
        'Data Preprocessing',
        'Cleaning and preparing data for machine learning',
        '# Data Preprocessing\n\nBefore we can train our models, we need to prepare our data...',
        3,
        25,
        'https://example.com/videos/ml-preprocessing'
    )
) AS lesson(title, description, content, order_index, duration_minutes, video_url);

-- Sample enrollment
INSERT INTO enrollments (user_id, course_id)
SELECT 
    'student-uuid-here',
    id
FROM courses 
WHERE slug = 'intro-to-machine-learning';

-- Sample lesson progress
WITH enrollment AS (
    SELECT e.id as enrollment_id, l.id as lesson_id
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    JOIN lessons l ON l.course_id = c.id
    WHERE e.user_id = 'student-uuid-here'
    AND c.slug = 'intro-to-machine-learning'
    AND l.order_index < 2
)
INSERT INTO lesson_progress (enrollment_id, lesson_id, completed_at)
SELECT enrollment_id, lesson_id, NOW()
FROM enrollment;
*/

-- Helper query to verify the schema
SELECT 
    'Tables created:' as info,
    count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;