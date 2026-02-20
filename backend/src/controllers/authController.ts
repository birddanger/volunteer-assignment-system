import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../middleware/validation.js';

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { email, password, first_name, last_name, phone, swimmer_team } = parsed.data;

    const existingUser = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await query(
      `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, swimmer_team, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, email, passwordHash, first_name, last_name, phone || null, swimmer_team || null, true]
    );

    const token = jwt.sign(
      { user_id: userId, email, is_organizer: false },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } as jwt.SignOptions
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user_id: userId,
      email,
      first_name,
      last_name,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;

    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, is_organizer: user.is_organizer },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } as jwt.SignOptions
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_organizer: user.is_organizer,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT user_id, email, first_name, last_name, phone, swimmer_team, is_organizer, created_at
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully' });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { phone, swimmer_team } = parsed.data;

    await query(
      `UPDATE users SET phone = $1, swimmer_team = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [phone || null, swimmer_team || null, req.user.user_id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function getAssignmentHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT a.assignment_id, a.assigned_at, a.status,
              t.title, t.description, t.start_time, t.end_time, t.task_id,
              s.name as session_name, s.date,
              e.name as event_name, e.event_id, e.location
       FROM assignments a
       JOIN tasks t ON a.task_id = t.task_id
       JOIN sessions s ON t.session_id = s.session_id
       JOIN events e ON t.event_id = e.event_id
       WHERE a.user_id = $1
       ORDER BY s.date DESC, t.start_time DESC`,
      [req.user.user_id]
    );

    // Calculate total hours
    let totalMinutes = 0;
    for (const row of result.rows) {
      if (row.status !== 'Cancelled') {
        const [sh, sm] = row.start_time.split(':').map(Number);
        const [eh, em] = row.end_time.split(':').map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
      }
    }

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const uniqueEvents = new Set(result.rows.map(r => r.event_id)).size;

    res.json({
      assignments: result.rows,
      stats: {
        totalAssignments: result.rows.filter(r => r.status !== 'Cancelled').length,
        totalHours,
        totalEvents: uniqueEvents,
      },
    });
  } catch (error) {
    console.error('Get assignment history error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment history' });
  }
}
