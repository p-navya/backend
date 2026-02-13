import express from 'express';
import { register, login, getMe, forgotPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { changePassword } from '../controllers/passwordController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;

