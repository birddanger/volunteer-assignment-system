import { query } from './pool.js';

export async function setupDatabase() {
  console.log('Setting up database...');

  // Create ENUM types
  await query(`
    DO $$ BEGIN
      CREATE TYPE assignment_status AS ENUM ('Assigned', 'Confirmed', 'Completed', 'Cancelled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE task_status AS ENUM ('Open', 'Partially Filled', 'Filled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM ('Confirmation', 'Reminder', 'Manual');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE notification_status AS ENUM ('Sent', 'Failed', 'Bounced');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      swimmer_team VARCHAR(100),
      is_organizer BOOLEAN DEFAULT FALSE,
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS events (
      event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      location VARCHAR(255) NOT NULL,
      description TEXT,
      created_by UUID NOT NULL REFERENCES users(user_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      location VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
      event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      required_volunteers INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(50) NOT NULL DEFAULT 'Open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS assignments (
      assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      assigned_by UUID REFERENCES users(user_id),
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
      UNIQUE(task_id, user_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      assignment_id UUID REFERENCES assignments(assignment_id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      sent_at TIMESTAMP,
      status VARCHAR(50) NOT NULL DEFAULT 'Sent',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // In-app notifications table
  await query(`
    CREATE TABLE IF NOT EXISTS in_app_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      link VARCHAR(500),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Event templates table
  await query(`
    CREATE TABLE IF NOT EXISTS event_templates (
      template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      event_config JSONB NOT NULL,
      sessions JSONB NOT NULL DEFAULT '[]',
      tasks JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Competition schedule table
  await query(`
    CREATE TABLE IF NOT EXISTS competition_entries (
      entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
      team_name VARCHAR(255),
      swimmer_name VARCHAR(255),
      discipline VARCHAR(255) NOT NULL,
      category VARCHAR(255),
      scheduled_date DATE NOT NULL,
      scheduled_time TIME NOT NULL,
      estimated_end_time TIME,
      pool_location VARCHAR(255),
      notes TEXT,
      created_by UUID NOT NULL REFERENCES users(user_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Event visibility columns (safe to run multiple times)
  await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';`);
  await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20);`);

  // Event memberships: tracks which users have joined which events
  await query(`
    CREATE TABLE IF NOT EXISTS event_memberships (
      membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      joined_via VARCHAR(20) NOT NULL DEFAULT 'public',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );
  `);

  // Event teams: which teams are invited to restricted events
  await query(`
    CREATE TABLE IF NOT EXISTS event_teams (
      event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
      team_name VARCHAR(255) NOT NULL,
      invited_by UUID NOT NULL REFERENCES users(user_id),
      invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(event_id, team_name)
    );
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_competition_entries_event_id ON competition_entries(event_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_competition_entries_date ON competition_entries(event_id, scheduled_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_competition_entries_team ON competition_entries(team_name);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_in_app_notifications_unread ON in_app_notifications(user_id, is_read) WHERE is_read = FALSE;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_event_templates_created_by ON event_templates(created_by);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_event_memberships_event_id ON event_memberships(event_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_event_memberships_user_id ON event_memberships(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_event_teams_event_id ON event_teams(event_id);`);

  console.log('Database setup complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
}
