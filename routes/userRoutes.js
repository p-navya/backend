import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;

