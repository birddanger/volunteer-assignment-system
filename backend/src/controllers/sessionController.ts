import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createSessionSchema } from '../middleware/validation.js';

export async function createSession(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can create sessions' });
    }

    const { eventId } = req.params;
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { name, date, start_time, end_time, location } = parsed.data;

    const sessionId = uuidv4();
    await query(
      `INSERT INTO sessions (session_id, event_id, name, date, start_time, end_time, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, eventId, name, date, start_time, end_time, location || null]
    );

    res.status(201).json({ session_id: sessionId, name, date, start_time, end_time, location });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
}

export async function listSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const result = await query(
      'SELECT * FROM sessions WHERE event_id = $1 ORDER BY date ASC, start_time ASC',
      [eventId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
}
