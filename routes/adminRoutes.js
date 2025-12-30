import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getStats, createMentor, getMentors } from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.post('/mentors', createMentor);
router.get('/mentors', getMentors);

export default router;

