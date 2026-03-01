import { Router } from 'express';
import {
  updateEventVisibility,
  getEventVisibility,
  joinEvent,
  leaveEvent,
  listEventMembers,
  getMyMemberships,
} from '../controllers/membershipController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Membership lookup (any logged-in user)
router.get('/my-memberships', authMiddleware, getMyMemberships);

// Event-scoped routes (require :eventId in URL)
router.get('/:eventId/visibility', authMiddleware, organizerMiddleware, getEventVisibility);
router.patch('/:eventId/visibility', authMiddleware, organizerMiddleware, updateEventVisibility);
router.post('/:eventId/join', authMiddleware, joinEvent);
router.delete('/:eventId/leave', authMiddleware, leaveEvent);
router.get('/:eventId/members', authMiddleware, organizerMiddleware, listEventMembers);

export default router;
