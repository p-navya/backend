import { supabase } from '../config/supabase.js';

// @desc    Get all available quizzes
// @route   GET /api/quizzes
// @access  Public
export const getQuizzes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new quiz (Mentor/Teacher)
// @route   POST /api/quizzes
// @access  Private
export const createQuiz = async (req, res) => {
    const { title, subject, description, time_limit, questions } = req.body;

    try {
        // Since we're using custom JWT auth (not Supabase Auth),
        // RLS policies with auth.uid() won't work. We use the regular
        // supabase client and rely on our middleware for authentication.
        const { data, error } = await supabase
            .from('quizzes')
            .insert([
                {
                    title,
                    subject,
                    description,
                    time_limit_minutes: time_limit || 15,
                    questions: questions || [],
                    creator_id: req.user.id
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Create Quiz Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit a quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuizAttempt = async (req, res) => {
    const { id } = req.params; // Quiz ID
    const { answers } = req.body; // { qIndex: selectedOptionIndex }

    try {
        // 1. Fetch Quiz for Correct Answers
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', id)
            .single();

        if (quizError || !quiz) throw new Error('Quiz not found');

        // 2. Score the Attempt
        let score = 0;
        let totalPoints = 0;

        quiz.questions.forEach((q, idx) => {
            totalPoints += 10;
            if (answers[idx] === q.correctIndex) {
                score += 10;
            }
        });

        const percentage = Math.round((score / totalPoints) * 100);

        // 3. Save Attempt
        const { data: attempt, error: attemptError } = await supabase
            .from('quiz_attempts')
            .insert([
                {
                    quiz_id: id,
                    student_id: req.user.id,
                    score: percentage,
                    total_points: totalPoints,
                    answers: answers
                }
            ])
            .select()
            .single();

        if (attemptError) throw attemptError;

        // 4. Log Activity for Dashboard
        try {
            await supabase.from('user_activity').insert([{
                user_id: req.user.id,
                activity_type: 'quiz_complete',
                description: `Completed quiz: ${quiz.title}`,
                duration_minutes: quiz.time_limit_minutes,
                metadata: { score: percentage, quiz_id: id }
            }]);
        } catch (logErr) {
            console.error('Failed to log quiz activity', logErr);
        }

        res.status(201).json({ success: true, data: { ...attempt, percentage } });

    } catch (error) {
        console.error('Submit Quiz Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my quiz history
// @route   GET /api/quizzes/attempts
// @access  Private
export const getMyAttempts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select(`
                *,
                quizzes ( title, subject )
            `)
            .eq('student_id', req.user.id)
            .order('completed_at', { ascending: false });

        if (error) throw error;

        // Transform for easier frontend consumption
        const history = data.map(attempt => ({
            id: attempt.id,
            testId: attempt.quiz_id,
            testName: attempt.quizzes?.title || 'Unknown Quiz',
            score: attempt.score,
            date: new Date(attempt.completed_at).toLocaleDateString(),
            xp: attempt.score * 10
        }));

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
