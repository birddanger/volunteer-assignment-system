import { Router } from 'express';
import {
  saveEventAsTemplate,
  listTemplates,
  getTemplate,
  createEventFromTemplate,
  deleteTemplate,
} from '../controllers/templateController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, organizerMiddleware, listTemplates);
router.get('/:templateId', authMiddleware, organizerMiddleware, getTemplate);
router.post('/from-event/:eventId', authMiddleware, organizerMiddleware, saveEventAsTemplate);
router.post('/:templateId/create-event', authMiddleware, organizerMiddleware, createEventFromTemplate);
router.delete('/:templateId', authMiddleware, organizerMiddleware, deleteTemplate);

export default router;
