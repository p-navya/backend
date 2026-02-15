-- Fix RLS policies for custom JWT authentication
-- Since we're using custom JWT (not Supabase Auth), auth.uid() won't work
-- We need to disable RLS or use service role key for these operations

-- Option 1: Disable RLS (simpler, but less secure)
-- We rely on application-level security (middleware) instead

ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;

-- Note: This is acceptable because:
-- 1. All routes are protected by our authentication middleware
-- 2. The middleware verifies the JWT and sets req.user
-- 3. We manually check permissions in the controller logic
-- 4. This is a common pattern when using custom auth with Supabase
