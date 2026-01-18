import express from 'express';
import multer from 'multer';
import { chat, getModels } from '../controllers/chatbotController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Memory storage for file handling (PDFs are processed in-memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Chat route supports file upload (pdf-qa, resume-review)
router.post('/chat', protect, upload.single('file'), chat);
router.get('/models', protect, getModels);

export default router;

