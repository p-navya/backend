-- Fix foreign key constraints to reference public.users instead of auth.users
-- This is necessary because we're using custom authentication, not Supabase Auth

-- 1. Drop existing foreign key constraints on quizzes table
ALTER TABLE public.quizzes 
DROP CONSTRAINT IF EXISTS quizzes_creator_id_fkey;

-- 2. Add new foreign key constraint referencing public.users
ALTER TABLE public.quizzes 
ADD CONSTRAINT quizzes_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Fix quiz_attempts table
ALTER TABLE public.quiz_attempts 
DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;

ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT quiz_attempts_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Fix tasks table (if it exists)
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Fix user_activity table (if it exists)
ALTER TABLE public.user_activity 
DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;

ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verify the changes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f' 
AND conrelid::regclass::text IN ('public.quizzes', 'public.quiz_attempts', 'public.tasks', 'public.user_activity')
ORDER BY table_name, constraint_name;
