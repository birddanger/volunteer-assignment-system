import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile, getAssignmentHistory } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile/history', authMiddleware, getAssignmentHistory);

export default router;
