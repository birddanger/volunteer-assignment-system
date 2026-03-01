import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// ───── helpers ─────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ───── event visibility ─────

/** PATCH /api/events/:eventId/visibility — update event visibility settings */
export async function updateEventVisibility(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const { visibility, invited_teams } = req.body;

    const validTypes = ['public', 'invite_code', 'teams_only', 'code_or_teams'];
    if (!validTypes.includes(visibility)) {
      return res.status(400).json({ error: `visibility must be one of: ${validTypes.join(', ')}` });
    }

    // Generate invite code if switching to a mode that needs one
    let inviteCode: string | null = null;
    if (visibility === 'invite_code' || visibility === 'code_or_teams') {
      // Keep existing code or generate new
      const existing = await query('SELECT invite_code FROM events WHERE event_id = $1', [eventId]);
      inviteCode = existing.rows[0]?.invite_code || generateInviteCode();
    }

    await query(
      `UPDATE events SET visibility = $1, invite_code = $2, updated_at = CURRENT_TIMESTAMP WHERE event_id = $3`,
      [visibility, inviteCode, eventId]
    );

    // Update invited teams if provided
    if (Array.isArray(invited_teams)) {
      await query('DELETE FROM event_teams WHERE event_id = $1', [eventId]);
      for (const teamName of invited_teams) {
        if (typeof teamName === 'string' && teamName.trim()) {
          await query(
            'INSERT INTO event_teams (event_id, team_name, invited_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [eventId, teamName.trim(), req.user!.user_id]
          );
        }
      }
    }

    // Auto-create membership for event creator
    await query(
      `INSERT INTO event_memberships (membership_id, event_id, user_id, joined_via)
       VALUES ($1, $2, $3, 'public')
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [uuidv4(), eventId, req.user!.user_id]
    );

    // Return updated event
    const result = await query('SELECT * FROM events WHERE event_id = $1', [eventId]);
    const teams = await query('SELECT team_name FROM event_teams WHERE event_id = $1 ORDER BY team_name', [eventId]);
    res.json({ ...result.rows[0], invited_teams: teams.rows.map(r => r.team_name) });
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({ error: 'Failed to update event visibility' });
  }
}

/** GET /api/events/:eventId/visibility — get visibility settings + invited teams */
export async function getEventVisibility(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const ev = await query('SELECT visibility, invite_code FROM events WHERE event_id = $1', [eventId]);
    if (ev.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const teams = await query('SELECT team_name FROM event_teams WHERE event_id = $1 ORDER BY team_name', [eventId]);
    const memberCount = await query('SELECT COUNT(*) FROM event_memberships WHERE event_id = $1', [eventId]);

    res.json({
      visibility: ev.rows[0].visibility,
      invite_code: ev.rows[0].invite_code,
      invited_teams: teams.rows.map(r => r.team_name),
      member_count: parseInt(memberCount.rows[0].count),
    });
  } catch (error) {
    console.error('Get visibility error:', error);
    res.status(500).json({ error: 'Failed to get visibility settings' });
  }
}

// ───── join / leave ─────

/** POST /api/events/:eventId/join — volunteer joins an event */
export async function joinEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const { invite_code } = req.body;
    const userId = req.user!.user_id;

    // Look up event
    const ev = await query('SELECT visibility, invite_code FROM events WHERE event_id = $1', [eventId]);
    if (ev.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const event = ev.rows[0];
    let joinedVia = 'public';

    if (event.visibility === 'public') {
      joinedVia = 'public';
    } else if (event.visibility === 'invite_code') {
      if (!invite_code || invite_code.toUpperCase() !== event.invite_code) {
        return res.status(403).json({ error: 'Invalid invite code' });
      }
      joinedVia = 'invite_code';
    } else if (event.visibility === 'teams_only') {
      // Check if user's team is invited
      const userResult = await query('SELECT swimmer_team FROM users WHERE user_id = $1', [userId]);
      const userTeam = userResult.rows[0]?.swimmer_team;
      if (!userTeam) return res.status(403).json({ error: 'No team set on your profile' });

      const teamCheck = await query(
        'SELECT 1 FROM event_teams WHERE event_id = $1 AND team_name = $2',
        [eventId, userTeam]
      );
      if (teamCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Your team is not invited to this event' });
      }
      joinedVia = 'team';
    } else if (event.visibility === 'code_or_teams') {
      // Check team first, then try code
      const userResult = await query('SELECT swimmer_team FROM users WHERE user_id = $1', [userId]);
      const userTeam = userResult.rows[0]?.swimmer_team;

      const teamCheck = userTeam
        ? await query('SELECT 1 FROM event_teams WHERE event_id = $1 AND team_name = $2', [eventId, userTeam])
        : { rows: [] };

      if (teamCheck.rows.length > 0) {
        joinedVia = 'team';
      } else if (invite_code && invite_code.toUpperCase() === event.invite_code) {
        joinedVia = 'invite_code';
      } else {
        return res.status(403).json({ error: 'Invalid invite code or team not invited' });
      }
    }

    await query(
      `INSERT INTO event_memberships (membership_id, event_id, user_id, joined_via)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [uuidv4(), eventId, userId, joinedVia]
    );

    res.json({ message: 'Joined event successfully', joined_via: joinedVia });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
}

/** DELETE /api/events/:eventId/leave — volunteer leaves an event */
export async function leaveEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const userId = req.user!.user_id;

    // Don't allow event creator to leave
    const ev = await query('SELECT created_by FROM events WHERE event_id = $1', [eventId]);
    if (ev.rows[0]?.created_by === userId) {
      return res.status(400).json({ error: 'Event creator cannot leave their own event' });
    }

    await query('DELETE FROM event_memberships WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
    res.json({ message: 'Left event successfully' });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ error: 'Failed to leave event' });
  }
}

/** GET /api/events/:eventId/members — list event members (organizer only) */
export async function listEventMembers(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const result = await query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.swimmer_team,
              m.joined_via, m.joined_at
       FROM event_memberships m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.event_id = $1
       ORDER BY m.joined_at`,
      [eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Failed to list members' });
  }
}

/** GET /api/events/my-memberships — events the current user has joined */
export async function getMyMemberships(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.user_id;
    const result = await query(
      'SELECT event_id FROM event_memberships WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows.map(r => r.event_id));
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({ error: 'Failed to get memberships' });
  }
}
