import { Router } from 'express';
import { listUsers, updateUserRole } from '../controllers/userController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router();

// All user-management routes require auth + organizer
router.use(authMiddleware, organizerMiddleware);

router.get('/', listUsers);
router.patch('/:userId/role', updateUserRole);

export default router;
