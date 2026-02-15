-- Create user_activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(255) NOT NULL, -- e.g., 'login', 'study_session', 'quiz_completed'
    description TEXT,
    duration_minutes INTEGER DEFAULT 0, -- relevant for 'study_session'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own activity
CREATE POLICY "Users can view own activity" ON public.user_activity
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own activity
CREATE POLICY "Users can insert own activity" ON public.user_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index on user_id and created_at for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON public.user_activity (user_id, created_at);
