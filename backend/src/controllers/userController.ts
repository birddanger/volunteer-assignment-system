import { Response } from 'express';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

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
