import { Router } from 'express';
import {
  createEvent,
  getEvent,
  listEvents,
  updateEvent
} from '../controllers/eventController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, organizerMiddleware, createEvent);
router.get('/', authMiddleware, listEvents);
router.get('/:eventId', authMiddleware, getEvent);
router.put('/:eventId', authMiddleware, organizerMiddleware, updateEvent);

export default router;
