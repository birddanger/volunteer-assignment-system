import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  removeNotification,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.put('/read-all', authMiddleware, markAllRead);
router.put('/:id/read', authMiddleware, markNotificationRead);
router.delete('/:id', authMiddleware, removeNotification);

export default router;
