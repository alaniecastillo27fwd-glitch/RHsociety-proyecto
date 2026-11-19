import { Router } from 'express';
import {
  getDailyReport,
  getReportsHistory,
  generateReportNow,
  updateRequestStatus,
  getPendingRequests,
  getTickets,
  resolveTicket,
} from '../controllers/dashboardController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas del dashboard están protegidas exclusivamente para RRHH
router.use(verifyToken, requireRole('rrhh'));

// Reportes
router.get('/report', getDailyReport);
router.get('/reports', getReportsHistory);
router.post('/generate-report', generateReportNow);

// Solicitudes
router.get('/requests/pending', getPendingRequests);
router.patch('/requests/:id', updateRequestStatus);
router.put('/requests/:id', updateRequestStatus);
router.post('/requests/:id', updateRequestStatus);
router.post('/requests/:id/status', updateRequestStatus);

// Tickets de escalamiento
router.get('/tickets', getTickets);
router.patch('/tickets/:id', resolveTicket);
router.put('/tickets/:id', resolveTicket);
router.post('/tickets/:id', resolveTicket);
router.post('/tickets/:id/resolve', resolveTicket);

export default router;
