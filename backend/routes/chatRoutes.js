import { Router } from 'express';
import { askQuestion, getMyChatHistory } from '../controllers/chatController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/chat/ask (Protegido por JWT)
router.post('/ask', verifyToken, askQuestion);

// GET /api/chat/history (Protegido por JWT)
router.get('/history', verifyToken, getMyChatHistory);

export default router;
