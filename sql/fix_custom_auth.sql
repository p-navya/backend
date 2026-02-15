-- Comprehensive fix for custom JWT authentication with Supabase
-- This script fixes both foreign key constraints and RLS policies

-- PART 1: Fix Foreign Key Constraints
-- Change references from auth.users to public.users

-- 1. Fix quizzes table
ALTER TABLE public.quizzes 
DROP CONSTRAINT IF EXISTS quizzes_creator_id_fkey;

ALTER TABLE public.quizzes 
ADD CONSTRAINT quizzes_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Fix quiz_attempts table
ALTER TABLE public.quiz_attempts 
DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;

ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT quiz_attempts_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Fix tasks table
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Fix user_activity table
ALTER TABLE public.user_activity 
DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;

ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- PART 2: Disable RLS Policies
-- Since we're using custom JWT (not Supabase Auth), auth.uid() won't work
-- We rely on application-level security (middleware) instead

ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f' 
AND conrelid::regclass::text IN ('public.quizzes', 'public.quiz_attempts', 'public.tasks', 'public.user_activity')
ORDER BY table_name, constraint_name;
