import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';

export type NotificationType = 'assignment' | 'unassignment' | 'reminder' | 'announcement' | 'info';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
) {
  const id = uuidv4();
  await query(
    `INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, title, message, type, link || null]
  );
  return id;
}

export async function getUserNotifications(userId: string, limit = 50, offset = 0) {
  const result = await query(
    `SELECT * FROM in_app_notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int as count FROM in_app_notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0].count;
}

export async function markAsRead(notificationId: string, userId: string) {
  const result = await query(
    `UPDATE in_app_notifications SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

export async function markAllAsRead(userId: string) {
  await query(
    `UPDATE in_app_notifications SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
}

export async function deleteNotification(notificationId: string, userId: string) {
  await query(
    `DELETE FROM in_app_notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
}
