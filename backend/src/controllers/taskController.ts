import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateTaskStatus } from '../services/assignmentService.js';
import { checkTimeConflict } from '../services/assignmentService.js';
import { sendConfirmationEmail, sendReminderEmail } from '../services/emailService.js';
import { createTaskSchema } from '../middleware/validation.js';
import { createNotification } from '../services/notificationService.js';

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can create tasks' });
    }

    const { eventId } = req.params;
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { title, description, instructions, start_time, end_time, required_volunteers, session_id: sessionId } = parsed.data;

    const taskId = uuidv4();
    await query(
      `INSERT INTO tasks (task_id, session_id, event_id, title, description, instructions, start_time, end_time, required_volunteers, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [taskId, sessionId, eventId, title, description, instructions || null, start_time, end_time, required_volunteers || 1, 'Open']
    );

    res.status(201).json({
      task_id: taskId,
      title,
      description,
      start_time,
      end_time,
      required_volunteers,
      status: 'Open'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

export async function listTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT t.*, s.name as session_name, s.date, s.start_time as session_start, s.end_time as session_end
       FROM tasks t
       JOIN sessions s ON t.session_id = s.session_id
       WHERE t.event_id = $1
       ORDER BY s.date ASC, t.start_time ASC`,
      [eventId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
}

export async function getTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT t.*, s.date, s.name as session_name
       FROM tasks t
       JOIN sessions s ON t.session_id = s.session_id
       WHERE t.task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
}

export async function selfSignUpTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { taskId } = req.params;

    // Get task details
    const taskResult = await query(
      `SELECT t.*, s.date, s.name as session_name, e.location, e.name as event_name, u.email as organizer_email
       FROM tasks t
       JOIN sessions s ON t.session_id = s.session_id
       JOIN events e ON t.event_id = e.event_id
       JOIN users u ON e.created_by = u.user_id
       WHERE t.task_id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check for time conflicts
    const conflicts = await checkTimeConflict(req.user.user_id, task.start_time, task.end_time, task.date, taskId);
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Time conflict detected',
        conflict: conflicts[0]
      });
    }

    // Check if already assigned
    const existingAssignment = await query(
      'SELECT assignment_id FROM assignments WHERE task_id = $1 AND user_id = $2',
      [taskId, req.user.user_id]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({ error: 'Already assigned to this task' });
    }

    // Create assignment
    const assignmentId = uuidv4();
    await query(
      `INSERT INTO assignments (assignment_id, task_id, user_id, assigned_by, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [assignmentId, taskId, req.user.user_id, null, 'Confirmed']
    );

    // Update task status
    await updateTaskStatus(taskId);

    // Get volunteer details for email
    const volunteerResult = await query(
      'SELECT first_name, last_name, email FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    const volunteer = volunteerResult.rows[0];

    // Send confirmation email
    await sendConfirmationEmail(
      volunteer.email,
      `${volunteer.first_name} ${volunteer.last_name}`,
      task.title,
      `${task.start_time} - ${task.end_time}`,
      task.location,
      task.description,
      task.organizer_email
    );

    // Create in-app notification
    await createNotification(
      req.user.user_id,
      'Sign-Up Confirmed',
      `You signed up for "${task.title}" (${task.start_time}–${task.end_time})`,
      'assignment',
      `/dashboard?event=${task.event_id}`
    );

    res.status(201).json({
      assignment_id: assignmentId,
      task_id: taskId,
      status: 'Confirmed'
    });
  } catch (error) {
    console.error('Self sign-up error:', error);
    res.status(500).json({ error: 'Failed to sign up for task' });
  }
}
