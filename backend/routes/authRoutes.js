import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me (Protegido)
router.get('/me', verifyToken, getProfile);

export default router;
