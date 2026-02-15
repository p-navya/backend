import express from 'express';
import {
    getGroups,
    getMyGroups,
    createGroup,
    joinGroup,
    getGroupMessages,
    sendGroupMessage,
    deleteGroup
} from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route to browse groups (but we might want to protect it so users must browse as themselves)
// The controller uses req.user.id for 'getMyGroups', so 'protect' is needed there.
// For consistency, let's protect everything. It's a "closed" platform for registered users.
router.use(protect);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/my', getMyGroups);
router.post('/:id/join', joinGroup);
router.get('/:id/messages', getGroupMessages);
router.post('/:id/messages', sendGroupMessage);
router.delete('/:id', deleteGroup);

export default router;
