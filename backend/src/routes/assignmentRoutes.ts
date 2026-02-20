import { Router } from 'express';
import {
  manualAssign,
  unassign,
  cancelMyAssignment,
  getMyAssignments,
  getAvailableTasksForEvent,
  getAdminDashboardData,
  exportCSV,
  getVolunteersList,
  getTaskAssignments
} from '../controllers/assignmentController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/assign', authMiddleware, organizerMiddleware, manualAssign);
router.delete('/:assignmentId', authMiddleware, organizerMiddleware, unassign);
router.delete('/my-assignments/:assignmentId', authMiddleware, cancelMyAssignment);
router.get('/my-assignments', authMiddleware, getMyAssignments);
router.get('/volunteers', authMiddleware, organizerMiddleware, getVolunteersList);
router.get('/available/:eventId', authMiddleware, getAvailableTasksForEvent);
router.get('/dashboard/:eventId', authMiddleware, organizerMiddleware, getAdminDashboardData);
router.get('/task-assignments/:eventId', authMiddleware, organizerMiddleware, getTaskAssignments);
router.get('/export/:eventId', authMiddleware, organizerMiddleware, exportCSV);

export default router;
