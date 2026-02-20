import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateTaskStatus, checkTimeConflict, getVolunteerAssignments, getAvailableTasks, getAdminDashboard, listVolunteers, getTaskAssignmentsDetailed } from '../services/assignmentService.js';
import { sendConfirmationEmail } from '../services/emailService.js';
import { manualAssignSchema } from '../middleware/validation.js';
import { createNotification } from '../services/notificationService.js';

export async function manualAssign(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manually assign tasks' });
    }

    const parsed = manualAssignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { taskId, volunteerId } = parsed.data;

    // Get task details
    const taskResult = await query(
      `SELECT t.*, s.date, e.location, e.name as event_name, u.email as organizer_email
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
    const conflicts = await checkTimeConflict(volunteerId, task.start_time, task.end_time, task.date, taskId);
    if (conflicts.length > 0 && !req.body.force) {
      return res.status(409).json({
        error: 'Time conflict detected',
        conflict: conflicts[0],
        hint: 'Set force=true to override'
      });
    }

    // Check if already assigned
    const existingAssignment = await query(
      'SELECT assignment_id FROM assignments WHERE task_id = $1 AND user_id = $2',
      [taskId, volunteerId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({ error: 'Volunteer already assigned to this task' });
    }

    // Create assignment
    const assignmentId = uuidv4();
    await query(
      `INSERT INTO assignments (assignment_id, task_id, user_id, assigned_by, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [assignmentId, taskId, volunteerId, req.user.user_id, 'Assigned']
    );

    // Update task status
    await updateTaskStatus(taskId);

    // Get volunteer details for email
    const volunteerResult = await query(
      'SELECT first_name, last_name, email FROM users WHERE user_id = $1',
      [volunteerId]
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

    // Create in-app notification for the volunteer
    await createNotification(
      volunteerId,
      'New Assignment',
      `You have been assigned to "${task.title}" (${task.start_time}–${task.end_time})`,
      'assignment',
      `/dashboard?event=${task.event_id}`
    );

    res.status(201).json({
      assignment_id: assignmentId,
      task_id: taskId,
      volunteer_id: volunteerId,
      status: 'Assigned'
    });
  } catch (error) {
    console.error('Manual assign error:', error);
    res.status(500).json({ error: 'Failed to assign volunteer' });
  }
}

export async function unassign(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can unassign volunteers' });
    }

    const { assignmentId } = req.params;

    // Get assignment to find task
    const assignmentResult = await query(
      'SELECT task_id FROM assignments WHERE assignment_id = $1',
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const taskId = assignmentResult.rows[0].task_id;

    // Get assignment details for notification
    const detailResult = await query(
      `SELECT a.user_id, t.title, t.event_id FROM assignments a
       JOIN tasks t ON a.task_id = t.task_id
       WHERE a.assignment_id = $1`,
      [assignmentId]
    );
    const detail = detailResult.rows[0];

    // Delete assignment
    await query('DELETE FROM assignments WHERE assignment_id = $1', [assignmentId]);

    // Update task status
    await updateTaskStatus(taskId);

    // Notify the volunteer
    if (detail) {
      await createNotification(
        detail.user_id,
        'Assignment Removed',
        `You have been unassigned from "${detail.title}"`,
        'unassignment',
        `/dashboard?event=${detail.event_id}`
      );
    }

    res.json({ message: 'Volunteer unassigned successfully' });
  } catch (error) {
    console.error('Unassign error:', error);
    res.status(500).json({ error: 'Failed to unassign volunteer' });
  }
}

export async function cancelMyAssignment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { assignmentId } = req.params;

    // Verify the assignment belongs to this user
    const assignmentResult = await query(
      'SELECT assignment_id, task_id FROM assignments WHERE assignment_id = $1 AND user_id = $2',
      [assignmentId, req.user.user_id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const taskId = assignmentResult.rows[0].task_id;

    // Delete the assignment
    await query('DELETE FROM assignments WHERE assignment_id = $1', [assignmentId]);

    // Update task status
    await updateTaskStatus(taskId);

    res.json({ message: 'Sign-up cancelled successfully' });
  } catch (error) {
    console.error('Cancel assignment error:', error);
    res.status(500).json({ error: 'Failed to cancel sign-up' });
  }
}

export async function getMyAssignments(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const assignments = await getVolunteerAssignments(req.user.user_id);
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
}

export async function getAvailableTasksForEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const tasks = await getAvailableTasks(eventId);
    res.json(tasks);
  } catch (error) {
    console.error('Get available tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch available tasks' });
  }
}

export async function getAdminDashboardData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can access admin dashboard' });
    }

    const { eventId } = req.params;
    const dashboard = await getAdminDashboard(eventId);
    res.json(dashboard);
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

export async function exportCSV(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can export data' });
    }

    const { eventId } = req.params;

    const result = await query(`
      SELECT u.first_name, u.last_name, u.email, u.phone,
             t.title, t.start_time, t.end_time,
             s.date, s.name as session_name,
             e.location, e.name as event_name,
             a.assigned_at
      FROM assignments a
      JOIN users u ON a.user_id = u.user_id
      JOIN tasks t ON a.task_id = t.task_id
      JOIN sessions s ON t.session_id = s.session_id
      JOIN events e ON t.event_id = e.event_id
      WHERE t.event_id = $1 AND a.status != 'Cancelled'
      ORDER BY s.date, t.start_time
    `, [eventId]);

    // Generate CSV
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Task', 'Start Time', 'End Time', 'Session', 'Date', 'Location', 'Event', 'Assigned At'];
    const rows = result.rows.map(row => [
      row.first_name,
      row.last_name,
      row.email,
      row.phone || '',
      row.title,
      row.start_time,
      row.end_time,
      row.session_name,
      row.date,
      row.location,
      row.event_name,
      row.assigned_at
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="volunteer-assignments-${eventId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
}

export async function getVolunteersList(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can view volunteer list' });
    }
    const volunteers = await listVolunteers();
    res.json(volunteers);
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
}

export async function getTaskAssignments(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can view assignments' });
    }
    const { eventId } = req.params;
    const assignments = await getTaskAssignmentsDetailed(eventId);
    res.json(assignments);
  } catch (error) {
    console.error('Get task assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch task assignments' });
  }
}
