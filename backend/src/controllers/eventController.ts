import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createEventSchema, uuidParamSchema } from '../middleware/validation.js';

export async function createEvent(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || !req.user.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can create events' });
    }

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { name, start_date, end_date, location, description } = parsed.data;

    const eventId = uuidv4();
    await query(
      `INSERT INTO events (event_id, name, start_date, end_date, location, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [eventId, name, start_date, end_date, location, description || null, req.user.user_id]
    );

    // Auto-create membership for event creator
    await query(
      `INSERT INTO event_memberships (membership_id, event_id, user_id, joined_via)
       VALUES ($1, $2, $3, 'public') ON CONFLICT DO NOTHING`,
      [uuidv4(), eventId, req.user.user_id]
    );

    res.status(201).json({
      event_id: eventId,
      name,
      start_date,
      end_date,
      location,
      description
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

export async function getEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const result = await query('SELECT * FROM events WHERE event_id = $1', [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

export async function listEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.user_id;

    // Return all events with membership flag
    const result = await query(
      `SELECT e.*,
              CASE WHEN m.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_member
       FROM events e
       LEFT JOIN event_memberships m ON m.event_id = e.event_id AND m.user_id = $1
       ORDER BY e.start_date DESC
       LIMIT 50`,
      [userId]
    );

    // For organizers, also return invite codes; for others hide them
    const isOrganizer = req.user?.is_organizer;
    const events = result.rows.map(ev => ({
      ...ev,
      invite_code: isOrganizer ? ev.invite_code : undefined,
    }));

    res.json(events);
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || !req.user.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can update events' });
    }

    const { eventId } = req.params;
    const { name, start_date, end_date, location, description } = req.body;

    // Verify organizer owns this event
    const eventResult = await query('SELECT created_by FROM events WHERE event_id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventResult.rows[0].created_by !== req.user.user_id) {
      return res.status(403).json({ error: 'You can only update your own events' });
    }

    await query(
      `UPDATE events SET name = $1, start_date = $2, end_date = $3, location = $4, description = $5, updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $6`,
      [name || undefined, start_date || undefined, end_date || undefined, location || undefined, description || undefined, eventId]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
}
