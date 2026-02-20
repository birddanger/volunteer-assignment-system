import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Save an existing event (with its sessions + tasks) as a reusable template.
 */
export async function saveEventAsTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can create templates' });
    }

    const { eventId } = req.params;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    // Fetch event
    const eventResult = await query('SELECT * FROM events WHERE event_id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = eventResult.rows[0];

    // Fetch sessions
    const sessionsResult = await query(
      `SELECT name, date, start_time, end_time, location
       FROM sessions WHERE event_id = $1 ORDER BY date, start_time`,
      [eventId]
    );

    // Fetch tasks grouped by session
    const tasksResult = await query(
      `SELECT t.title, t.description, t.instructions, t.start_time, t.end_time,
              t.required_volunteers, s.name as session_name
       FROM tasks t
       JOIN sessions s ON t.session_id = s.session_id
       WHERE t.event_id = $1
       ORDER BY s.date, t.start_time`,
      [eventId]
    );

    // Build template data — store relative day offsets instead of absolute dates
    const eventStart = new Date(event.start_date);
    const sessionTemplates = sessionsResult.rows.map((s: any) => {
      const sessionDate = new Date(s.date);
      const dayOffset = Math.round((sessionDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
      return {
        name: s.name,
        day_offset: dayOffset,
        start_time: s.start_time,
        end_time: s.end_time,
        location: s.location,
      };
    });

    const taskTemplates = tasksResult.rows.map((t: any) => ({
      title: t.title,
      description: t.description,
      instructions: t.instructions,
      start_time: t.start_time,
      end_time: t.end_time,
      required_volunteers: t.required_volunteers,
      session_name: t.session_name, // link to session by name
    }));

    const eventConfig = {
      location: event.location,
      description: event.description,
      duration_days: Math.round(
        (new Date(event.end_date).getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    const templateId = uuidv4();
    await query(
      `INSERT INTO event_templates (template_id, name, description, created_by, event_config, sessions, tasks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        templateId,
        name.trim(),
        description || null,
        req.user.user_id,
        JSON.stringify(eventConfig),
        JSON.stringify(sessionTemplates),
        JSON.stringify(taskTemplates),
      ]
    );

    res.status(201).json({
      template_id: templateId,
      name: name.trim(),
      description,
      sessions_count: sessionTemplates.length,
      tasks_count: taskTemplates.length,
    });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
}

/**
 * List all available templates.
 */
export async function listTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can view templates' });
    }

    const result = await query(
      `SELECT template_id, name, description, created_at,
              jsonb_array_length(sessions) as sessions_count,
              jsonb_array_length(tasks) as tasks_count
       FROM event_templates
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
}

/**
 * Get a single template with full details.
 */
export async function getTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can view templates' });
    }

    const { templateId } = req.params;
    const result = await query('SELECT * FROM event_templates WHERE template_id = $1', [templateId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
}

/**
 * Create a new event from a template.
 * Requires: name, start_date, location (the rest comes from the template).
 */
export async function createEventFromTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can create events' });
    }

    const { templateId } = req.params;
    const { name, start_date, location } = req.body;

    if (!name || !start_date || !location) {
      return res.status(400).json({ error: 'name, start_date, and location are required' });
    }

    // Fetch template
    const templateResult = await query('SELECT * FROM event_templates WHERE template_id = $1', [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templateResult.rows[0];
    const eventConfig = template.event_config;
    const sessionTemplates = template.sessions;
    const taskTemplates = template.tasks;

    // Calculate end_date from duration
    const startDate = new Date(start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (eventConfig.duration_days || 0));
    const endDateStr = endDate.toISOString().split('T')[0];

    // Create event
    const eventId = uuidv4();
    await query(
      `INSERT INTO events (event_id, name, start_date, end_date, location, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        eventId,
        name,
        start_date,
        endDateStr,
        location,
        eventConfig.description || null,
        req.user.user_id,
      ]
    );

    // Create sessions with adjusted dates
    const sessionMap: Record<string, string> = {}; // session_name -> session_id
    for (const s of sessionTemplates) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(sessionDate.getDate() + (s.day_offset || 0));
      const sessionDateStr = sessionDate.toISOString().split('T')[0];

      const sessionId = uuidv4();
      await query(
        `INSERT INTO sessions (session_id, event_id, name, date, start_time, end_time, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sessionId, eventId, s.name, sessionDateStr, s.start_time, s.end_time, s.location || location]
      );
      sessionMap[s.name] = sessionId;
    }

    // Create tasks linked to sessions by name
    for (const t of taskTemplates) {
      const sessionId = sessionMap[t.session_name];
      if (!sessionId) continue; // skip if session not found

      const taskId = uuidv4();
      await query(
        `INSERT INTO tasks (task_id, session_id, event_id, title, description, instructions, start_time, end_time, required_volunteers, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          taskId,
          sessionId,
          eventId,
          t.title,
          t.description,
          t.instructions || null,
          t.start_time,
          t.end_time,
          t.required_volunteers || 1,
          'Open',
        ]
      );
    }

    res.status(201).json({
      event_id: eventId,
      name,
      start_date,
      end_date: endDateStr,
      location,
      sessions_created: Object.keys(sessionMap).length,
      tasks_created: taskTemplates.filter((t: any) => sessionMap[t.session_name]).length,
    });
  } catch (error) {
    console.error('Create from template error:', error);
    res.status(500).json({ error: 'Failed to create event from template' });
  }
}

/**
 * Delete a template.
 */
export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can delete templates' });
    }

    const { templateId } = req.params;
    const result = await query(
      'DELETE FROM event_templates WHERE template_id = $1 RETURNING template_id',
      [templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}
