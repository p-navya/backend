import express from 'express';
import { logActivity, getActivityStats } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Ensure all routes are protected

router.post('/', logActivity);
router.get('/stats', getActivityStats);

export default router;
