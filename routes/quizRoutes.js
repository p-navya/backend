import express from 'express';
import { getQuizzes, createQuiz, submitQuizAttempt, getMyAttempts } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All quiz routes require authentication (for tracking progress)

router.get('/', getQuizzes);
router.post('/', createQuiz); // For Mentors/Teachers to add content
router.post('/:id/submit', submitQuizAttempt);
router.get('/attempts', getMyAttempts);

export default router;
