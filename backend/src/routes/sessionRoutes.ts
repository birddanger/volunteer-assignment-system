import { Router } from 'express';
import {
  createSession,
  listSessions
} from '../controllers/sessionController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, organizerMiddleware, createSession);
router.get('/', authMiddleware, listSessions);

export default router;
