import { query } from '../db/pool.js';
import { Assignment, Task, User } from '../types.js';

export async function listVolunteers() {
  const result = await query(`
    SELECT user_id, email, first_name, last_name, phone, swimmer_team
    FROM users
    WHERE is_organizer = false
    ORDER BY last_name ASC, first_name ASC
  `);
  return result.rows;
}

export async function getTaskAssignmentsDetailed(eventId: string) {
  const result = await query(`
    SELECT a.assignment_id, a.task_id, a.user_id, a.status, a.assigned_at,
           u.first_name, u.last_name, u.email
    FROM assignments a
    JOIN users u ON a.user_id = u.user_id
    JOIN tasks t ON a.task_id = t.task_id
    WHERE t.event_id = $1 AND a.status != 'Cancelled'
    ORDER BY a.assigned_at ASC
  `, [eventId]);
  return result.rows;
}

export async function getTaskWithAssignments(taskId: string) {
  const taskResult = await query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
  if (taskResult.rows.length === 0) {
    throw new Error('Task not found');
  }

  const assignmentsResult = await query(
    'SELECT a.*, u.first_name, u.last_name, u.email FROM assignments a JOIN users u ON a.user_id = u.user_id WHERE a.task_id = $1',
    [taskId]
  );

  return {
    task: taskResult.rows[0],
    assignments: assignmentsResult.rows
  };
}

export async function checkTimeConflict(userId: string, startTime: string, endTime: string, taskDate: string, excludeTaskId?: string): Promise<any[]> {
  let sql = `
    SELECT a.*, t.title, t.start_time, t.end_time, s.date, s.name as session_name
    FROM assignments a
    JOIN tasks t ON a.task_id = t.task_id
    JOIN sessions s ON t.session_id = s.session_id
    WHERE a.user_id = $1
    AND a.status != 'Cancelled'
    AND s.date = $2
  `;
  
  const params: any[] = [userId, taskDate];

  if (excludeTaskId) {
    sql += ` AND t.task_id != $${params.length + 1}`;
    params.push(excludeTaskId);
  }

  const result = await query(sql, params);
  
  // Filter by time overlap
  return result.rows.filter(row => {
    const existingStart = row.start_time;
    const existingEnd = row.end_time;
    
    // Check if times overlap
    return (startTime < existingEnd && endTime > existingStart);
  });
}

export async function updateTaskStatus(taskId: string) {
  const countResult = await query(
    'SELECT COUNT(*) as assigned_count FROM assignments WHERE task_id = $1 AND status != $2',
    [taskId, 'Cancelled']
  );
  
  const taskResult = await query('SELECT required_volunteers FROM tasks WHERE task_id = $1', [taskId]);
  const task = taskResult.rows[0];
  const assignedCount = parseInt(countResult.rows[0].assigned_count);
  const requiredCount = task.required_volunteers;

  let status = 'Open';
  if (assignedCount >= requiredCount) {
    status = 'Filled';
  } else if (assignedCount > 0) {
    status = 'Partially Filled';
  }

  await query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE task_id = $2', [status, taskId]);
  return status;
}

export async function getVolunteerAssignments(userId: string) {
  const result = await query(`
    SELECT a.assignment_id, a.assigned_at, a.status,
           t.task_id, t.title, t.description, t.instructions, t.start_time, t.end_time,
           s.session_id, s.name as session_name, s.date,
           e.event_id, e.location, e.name as event_name
    FROM assignments a
    JOIN tasks t ON a.task_id = t.task_id
    JOIN sessions s ON t.session_id = s.session_id
    JOIN events e ON t.event_id = e.event_id
    WHERE a.user_id = $1
    ORDER BY s.date ASC, t.start_time ASC
  `, [userId]);

  return result.rows;
}

export async function getAvailableTasks(eventId: string) {
  const result = await query(`
    SELECT t.task_id, t.title, t.description, t.start_time, t.end_time, t.required_volunteers,
           s.session_id, s.name as session_name, s.date, e.location,
           COUNT(CASE WHEN a.status != 'Cancelled' THEN 1 END) as assigned_count
    FROM tasks t
    JOIN sessions s ON t.session_id = s.session_id
    JOIN events e ON t.event_id = e.event_id
    LEFT JOIN assignments a ON t.task_id = a.task_id
    WHERE t.event_id = $1
    GROUP BY t.task_id, s.session_id, e.event_id
    HAVING COUNT(CASE WHEN a.status != 'Cancelled' THEN 1 END) < t.required_volunteers
    ORDER BY s.date ASC, t.start_time ASC
  `, [eventId]);

  return result.rows;
}

export async function getAdminDashboard(eventId: string) {
  const tasksResult = await query(`
    SELECT t.task_id, t.title, t.required_volunteers, t.status,
           s.name as session_name, s.session_id, s.date, t.start_time, t.end_time,
           COUNT(CASE WHEN a.status != 'Cancelled' THEN 1 END) as assigned_count
    FROM tasks t
    JOIN sessions s ON t.session_id = s.session_id
    LEFT JOIN assignments a ON t.task_id = a.task_id
    WHERE t.event_id = $1
    GROUP BY t.task_id, s.session_id
    ORDER BY s.date ASC, t.start_time ASC
  `, [eventId]);

  const volunteersResult = await query(`
    SELECT COUNT(DISTINCT a.user_id) as total_volunteers,
           COUNT(DISTINCT CASE WHEN a.status != 'Cancelled' THEN a.assignment_id END) as total_assignments
    FROM assignments a
    JOIN tasks t ON a.task_id = t.task_id
    WHERE t.event_id = $1
  `, [eventId]);

  // Per-session stats
  const sessionStatsResult = await query(`
    SELECT s.session_id, s.name as session_name, s.date, s.start_time, s.end_time,
           COUNT(DISTINCT t.task_id) as total_tasks,
           SUM(t.required_volunteers) as total_slots,
           COUNT(DISTINCT CASE WHEN a.status != 'Cancelled' THEN a.assignment_id END) as filled_slots,
           COUNT(DISTINCT CASE WHEN a.status != 'Cancelled' THEN a.user_id END) as unique_volunteers
    FROM sessions s
    LEFT JOIN tasks t ON s.session_id = t.session_id
    LEFT JOIN assignments a ON t.task_id = a.task_id
    WHERE s.event_id = $1
    GROUP BY s.session_id
    ORDER BY s.date ASC, s.start_time ASC
  `, [eventId]);

  // Task status breakdown
  const tasks = tasksResult.rows;
  const filledCount = tasks.filter(t => t.status === 'Filled').length;
  const partialCount = tasks.filter(t => t.status === 'Partially Filled').length;
  const openCount = tasks.filter(t => t.status === 'Open').length;
  const totalSlots = tasks.reduce((sum: number, t: any) => sum + parseInt(t.required_volunteers), 0);
  const filledSlots = tasks.reduce((sum: number, t: any) => sum + parseInt(t.assigned_count), 0);

  return {
    tasks,
    summary: {
      ...volunteersResult.rows[0],
      total_tasks: tasks.length,
      filled_tasks: filledCount,
      partial_tasks: partialCount,
      open_tasks: openCount,
      total_slots: totalSlots,
      filled_slots: filledSlots,
      fill_rate: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
    },
    sessionStats: sessionStatsResult.rows,
  };
}
