import { Router } from 'express';
import {
  createEntry,
  bulkCreateEntries,
  listEntries,
  updateEntry,
  deleteEntry,
  deleteAllEntries,
  listTeams,
  listDisciplines,
  importCSV,
} from '../controllers/competitionController.js';
import { authMiddleware, organizerMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Read endpoints — all authenticated users
router.get('/', authMiddleware, listEntries);
router.get('/teams', authMiddleware, listTeams);
router.get('/disciplines', authMiddleware, listDisciplines);

// Write endpoints — organizers only
router.post('/', authMiddleware, organizerMiddleware, createEntry);
router.post('/bulk', authMiddleware, organizerMiddleware, bulkCreateEntries);
router.post('/import-csv', authMiddleware, organizerMiddleware, importCSV);
router.put('/:entryId', authMiddleware, organizerMiddleware, updateEntry);
router.delete('/:entryId', authMiddleware, organizerMiddleware, deleteEntry);
router.delete('/', authMiddleware, organizerMiddleware, deleteAllEntries);

export default router;
