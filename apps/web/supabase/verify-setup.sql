-- Verify database setup

-- Check all tables exist
SELECT 
    'Tables Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(table_name, ', ' ORDER BY table_name) as items
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('profiles', 'courses', 'lessons', 'enrollments', 'lesson_progress', 'ai_interactions');

-- Check RLS is enabled
SELECT 
    'RLS Enabled' as check_type,
    COUNT(*) as count,
    STRING_AGG(tablename, ', ' ORDER BY tablename) as items
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'courses', 'lessons', 'enrollments', 'lesson_progress', 'ai_interactions')
AND rowsecurity = true;

-- Check policies exist
SELECT 
    'Policies Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as items
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'courses', 'lessons', 'enrollments', 'lesson_progress', 'ai_interactions');

-- Check triggers exist
SELECT 
    'Triggers Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(trigger_name, ', ' ORDER BY trigger_name) as items
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check functions exist
SELECT 
    'Functions Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(routine_name, ', ' ORDER BY routine_name) as items
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';