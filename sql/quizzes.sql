-- Create a table for mentor-uploaded questions/quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id), -- Mentor/Teacher
    time_limit_minutes INTEGER DEFAULT 15,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, 
    -- Structure of questions JSONB: 
    -- [ { "id": 1, "text": "Question?", "options": ["A", "B", "C", "D"], "correctIndex": 0, "points": 10 } ]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Improve Activity Tracking for Quizzes
ALTER TABLE public.user_activity 
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id);

-- Create a table for student quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb, -- Store student answers { "q1_id": 0, "q2_id": 2 }
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_attempt UNIQUE (quiz_id, student_id) -- Prevent duplicate attempts if desired, or remove to allow retries
);

-- RLS Policies
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quizzes Policies
CREATE POLICY "Allow everyone to read quizzes" ON public.quizzes
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Attempts Policies
CREATE POLICY "Users can view their own attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Allow creators (mentors) to view attempts for their quizzes
CREATE POLICY "Mentors can view attempts on their quizzes" ON public.quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_attempts.quiz_id AND creator_id = auth.uid()
        )
    );
