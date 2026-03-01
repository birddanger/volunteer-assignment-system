import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { adminCreateUserSchema } from '../middleware/validation.js';

/** GET /api/users – list all registered users (admin only) */
export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await query(
      `SELECT user_id, email, first_name, last_name, phone, swimmer_team,
              is_organizer, email_verified, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/** POST /api/users – admin creates a new user */
export async function adminCreateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = adminCreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { email, password, first_name, last_name, phone, swimmer_team, is_organizer } = parsed.data;

    // Check duplicate email
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await query(
      `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, swimmer_team, is_organizer, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING user_id, email, first_name, last_name, phone, swimmer_team, is_organizer, email_verified, created_at`,
      [userId, email, passwordHash, first_name, last_name, phone || null, swimmer_team || null, is_organizer, true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/** PATCH /api/users/:userId/role – toggle organizer role */
export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { is_organizer } = req.body;

    if (typeof is_organizer !== 'boolean') {
      return res.status(400).json({ error: 'is_organizer must be a boolean' });
    }

    // Prevent admins from removing their own organizer role
    if (req.user?.user_id === userId && !is_organizer) {
      return res.status(400).json({ error: 'You cannot remove your own admin privileges' });
    }

    const result = await query(
      `UPDATE users SET is_organizer = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, email, first_name, last_name, phone, swimmer_team,
                 is_organizer, email_verified, created_at`,
      [is_organizer, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}
