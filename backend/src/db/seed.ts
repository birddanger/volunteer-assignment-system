import { query } from './pool.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  console.log('Seeding database...');

  // Check if admin user already exists
  const adminCheck = await query(
    `SELECT user_id FROM users WHERE email = $1`,
    ['admin@example.com']
  );

  let organizerId: string;

  if (adminCheck.rows && adminCheck.rows.length > 0) {
    // Admin already exists, use that ID
    organizerId = (adminCheck.rows[0] as { user_id: string }).user_id;
  } else {
    // Create organizer user
    const organizerPassword = await bcrypt.hash('admin123', 10);
    organizerId = uuidv4();

    await query(
      `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, is_organizer, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [organizerId, 'admin@example.com', organizerPassword, 'Admin', 'User', '555-0001', true, true]
    );
  }

  // Create sample volunteers
  const volunteerIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const email = `volunteer${i}@example.com`;
    const volunteerCheck = await query(
      `SELECT user_id FROM users WHERE email = $1`,
      [email]
    );

    let volunteerId: string;
    if (volunteerCheck.rows && volunteerCheck.rows.length > 0) {
      volunteerId = (volunteerCheck.rows[0] as { user_id: string }).user_id;
    } else {
      volunteerId = uuidv4();
      const password = await bcrypt.hash(`volunteer${i}`, 10);
      await query(
        `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, swimmer_team, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [volunteerId, email, password, `Volunteer`, `${i}`, `555-000${i}`, `Team A`, true]
      );
    }
    volunteerIds.push(volunteerId);
  }

  // Check if sample event already exists
  const eventCheck = await query(
    `SELECT event_id FROM events WHERE name = $1`,
    ['Regional Synchronized Swimming Championship 2026']
  );

  let eventId: string;
  if (eventCheck.rows && eventCheck.rows.length > 0) {
    eventId = (eventCheck.rows[0] as { event_id: string }).event_id;
  } else {
    // Create sample event
    eventId = uuidv4();
    await query(
      `INSERT INTO events (event_id, name, start_date, end_date, location, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        eventId,
        'Regional Synchronized Swimming Championship 2026',
        '2026-02-20',
        '2026-02-22',
        'Municipal Sports Complex',
        'Weekend championship event',
        organizerId
      ]
    );
  }

  // Create sessions (idempotent — check by name + event)
  const sessionIds: string[] = [];
  const sessions = [
    { name: 'Friday Evening - Setup', date: '2026-02-20', start: '17:00', end: '19:00' },
    { name: 'Saturday Morning - Preliminaries', date: '2026-02-21', start: '08:00', end: '12:00' },
    { name: 'Saturday Afternoon - Finals', date: '2026-02-21', start: '13:00', end: '17:00' },
    { name: 'Sunday - Finals & Awards', date: '2026-02-22', start: '09:00', end: '16:00' }
  ];

  for (const session of sessions) {
    const existing = await query(
      `SELECT session_id FROM sessions WHERE event_id = $1 AND name = $2`,
      [eventId, session.name]
    );
    if (existing.rows && existing.rows.length > 0) {
      sessionIds.push((existing.rows[0] as { session_id: string }).session_id);
    } else {
      const sessionId = uuidv4();
      await query(
        `INSERT INTO sessions (session_id, event_id, name, date, start_time, end_time, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sessionId, eventId, session.name, session.date, session.start, session.end, 'Municipal Sports Complex']
      );
      sessionIds.push(sessionId);
    }
  }

  // Create tasks (idempotent — check by title + session)
  const taskIds: string[] = [];
  const tasks = [
    { sessionIdx: 0, title: 'Setup - Audio/Visual', description: 'Install and test sound system and projection', required: 2 },
    { sessionIdx: 0, title: 'Setup - Registration Desk', description: 'Prepare registration materials', required: 3 },
    { sessionIdx: 1, title: 'Poolside Judge', description: 'Judging synchronized swimming performance', required: 4 },
    { sessionIdx: 1, title: 'Timer/Scorer', description: 'Track timing and scores', required: 2 },
    { sessionIdx: 2, title: 'Poolside Judge', description: 'Judging synchronized swimming performance', required: 4 },
    { sessionIdx: 2, title: 'Medical Support', description: 'Standby medical assistance', required: 1 },
    { sessionIdx: 3, title: 'Awards & Ceremonies', description: 'Manage awards distribution', required: 3 }
  ];

  for (const task of tasks) {
    const sessionId = sessionIds[task.sessionIdx];
    const existing = await query(
      `SELECT task_id FROM tasks WHERE session_id = $1 AND title = $2`,
      [sessionId, task.title]
    );
    if (existing.rows && existing.rows.length > 0) {
      taskIds.push((existing.rows[0] as { task_id: string }).task_id);
    } else {
      const taskId = uuidv4();
      const session = sessions[task.sessionIdx];
      await query(
        `INSERT INTO tasks (task_id, session_id, event_id, title, description, instructions, start_time, end_time, required_volunteers, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          taskId,
          sessionId,
          eventId,
          task.title,
          task.description,
          'Please arrive 15 minutes early',
          session.start,
          session.end,
          task.required,
          'Open'
        ]
      );
      taskIds.push(taskId);
    }
  }

  // Create a sample assignment (idempotent)
  if (taskIds.length > 0 && volunteerIds.length > 0) {
    const existingAssignment = await query(
      `SELECT assignment_id FROM assignments WHERE task_id = $1 AND user_id = $2`,
      [taskIds[0], volunteerIds[0]]
    );
    if (!existingAssignment.rows || existingAssignment.rows.length === 0) {
      const assignmentId = uuidv4();
      await query(
        `INSERT INTO assignments (assignment_id, task_id, user_id, assigned_by, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [assignmentId, taskIds[0], volunteerIds[0], organizerId, 'Confirmed']
      );
    }
  }

  console.log('Database seeding complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
