import { Router } from 'express';
import {
  createTask,
  listTasks,
  getTask,
  selfSignUpTask
} from '../controllers/taskController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, organizerMiddleware, createTask);
router.get('/', authMiddleware, listTasks);
router.get('/:taskId', authMiddleware, getTask);
router.post('/:taskId/signup', authMiddleware, selfSignUpTask);

export default router;
