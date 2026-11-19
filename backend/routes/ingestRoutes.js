import { Router } from 'express';
import { triggerSync, getSyncStatus } from '../controllers/ingestController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/ingest/sync (Protegido para RRHH)
router.post('/sync', verifyToken, requireRole('rrhh'), triggerSync);

// GET /api/ingest/status (Protegido para RRHH)
router.get('/status', verifyToken, requireRole('rrhh'), getSyncStatus);

export default router;
