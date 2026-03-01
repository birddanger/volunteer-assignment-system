import { Router } from 'express';
import { listUsers, updateUserRole, adminCreateUser } from '../controllers/userController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router();

// All user-management routes require auth + organizer
router.use(authMiddleware, organizerMiddleware);

router.get('/', listUsers);
router.post('/', adminCreateUser);
router.patch('/:userId/role', updateUserRole);

export default router;
