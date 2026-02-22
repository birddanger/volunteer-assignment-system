import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createCompetitionEntrySchema, bulkCompetitionEntrySchema } from '../middleware/validation.js';

// Create a single competition entry (organizer only)
export async function createEntry(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manage the competition schedule' });
    }

    const { eventId } = req.params;
    const parsed = createCompetitionEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { team_name, swimmer_name, discipline, category, scheduled_date, scheduled_time, estimated_end_time, pool_location, notes } = parsed.data;

    const entryId = uuidv4();
    await query(
      `INSERT INTO competition_entries (entry_id, event_id, team_name, swimmer_name, discipline, category, scheduled_date, scheduled_time, estimated_end_time, pool_location, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [entryId, eventId, team_name || null, swimmer_name || null, discipline, category || null, scheduled_date, scheduled_time, estimated_end_time || null, pool_location || null, notes || null, req.user.user_id]
    );

    res.status(201).json({
      entry_id: entryId,
      event_id: eventId,
      team_name,
      swimmer_name,
      discipline,
      category,
      scheduled_date,
      scheduled_time,
      estimated_end_time,
      pool_location,
      notes,
    });
  } catch (error) {
    console.error('Create competition entry error:', error);
    res.status(500).json({ error: 'Failed to create competition entry' });
  }
}

// Bulk create competition entries (organizer only)
export async function bulkCreateEntries(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manage the competition schedule' });
    }

    const { eventId } = req.params;
    const parsed = bulkCompetitionEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { entries } = parsed.data;
    let created = 0;

    for (const entry of entries) {
      const entryId = uuidv4();
      await query(
        `INSERT INTO competition_entries (entry_id, event_id, team_name, swimmer_name, discipline, category, scheduled_date, scheduled_time, estimated_end_time, pool_location, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [entryId, eventId, entry.team_name || null, entry.swimmer_name || null, entry.discipline, entry.category || null, entry.scheduled_date, entry.scheduled_time, entry.estimated_end_time || null, entry.pool_location || null, entry.notes || null, req.user!.user_id]
      );
      created++;
    }

    res.status(201).json({ created, total: entries.length });
  } catch (error) {
    console.error('Bulk create entries error:', error);
    res.status(500).json({ error: 'Failed to create competition entries' });
  }
}

// List competition entries for an event (all authenticated users)
export async function listEntries(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const { date, team, search } = req.query;

    let sql = `SELECT * FROM competition_entries WHERE event_id = $1`;
    const params: any[] = [eventId];
    let idx = 2;

    if (date) {
      sql += ` AND scheduled_date = $${idx++}`;
      params.push(date);
    }

    if (team) {
      sql += ` AND LOWER(team_name) = LOWER($${idx++})`;
      params.push(team);
    }

    if (search) {
      sql += ` AND (LOWER(team_name) LIKE LOWER($${idx}) OR LOWER(swimmer_name) LIKE LOWER($${idx}) OR LOWER(discipline) LIKE LOWER($${idx}))`;
      params.push(`%${search}%`);
      idx++;
    }

    sql += ` ORDER BY scheduled_date ASC, scheduled_time ASC, discipline ASC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List competition entries error:', error);
    res.status(500).json({ error: 'Failed to list competition entries' });
  }
}

// Update a competition entry (organizer only)
export async function updateEntry(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manage the competition schedule' });
    }

    const { eventId, entryId } = req.params;

    // Verify entry exists
    const existing = await query(
      `SELECT entry_id FROM competition_entries WHERE entry_id = $1 AND event_id = $2`,
      [entryId, eventId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const parsed = createCompetitionEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { team_name, swimmer_name, discipline, category, scheduled_date, scheduled_time, estimated_end_time, pool_location, notes } = parsed.data;

    await query(
      `UPDATE competition_entries
       SET team_name = $1, swimmer_name = $2, discipline = $3, category = $4,
           scheduled_date = $5, scheduled_time = $6, estimated_end_time = $7,
           pool_location = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
       WHERE entry_id = $10 AND event_id = $11`,
      [team_name || null, swimmer_name || null, discipline, category || null, scheduled_date, scheduled_time, estimated_end_time || null, pool_location || null, notes || null, entryId, eventId]
    );

    res.json({ message: 'Entry updated' });
  } catch (error) {
    console.error('Update competition entry error:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
}

// Delete a competition entry (organizer only)
export async function deleteEntry(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manage the competition schedule' });
    }

    const { eventId, entryId } = req.params;

    const result = await query(
      `DELETE FROM competition_entries WHERE entry_id = $1 AND event_id = $2`,
      [entryId, eventId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Delete competition entry error:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
}

// Delete all entries for an event (organizer only)
export async function deleteAllEntries(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manage the competition schedule' });
    }

    const { eventId } = req.params;

    const result = await query(
      `DELETE FROM competition_entries WHERE event_id = $1`,
      [eventId]
    );

    res.json({ message: 'All entries deleted', deleted: result.rowCount });
  } catch (error) {
    console.error('Delete all entries error:', error);
    res.status(500).json({ error: 'Failed to delete entries' });
  }
}

// Get unique teams for an event
export async function listTeams(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT DISTINCT team_name FROM competition_entries WHERE event_id = $1 AND team_name IS NOT NULL ORDER BY team_name`,
      [eventId]
    );

    res.json(result.rows.map((r: any) => r.team_name));
  } catch (error) {
    console.error('List teams error:', error);
    res.status(500).json({ error: 'Failed to list teams' });
  }
}

// Get unique disciplines for an event
export async function listDisciplines(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT DISTINCT discipline FROM competition_entries WHERE event_id = $1 ORDER BY discipline`,
      [eventId]
    );

    res.json(result.rows.map((r: any) => r.discipline));
  } catch (error) {
    console.error('List disciplines error:', error);
    res.status(500).json({ error: 'Failed to list disciplines' });
  }
}

// ── CSV helpers ──

const CSV_HEADERS = ['team_name', 'swimmer_name', 'discipline', 'category', 'scheduled_date', 'scheduled_time', 'estimated_end_time', 'pool_location', 'notes'] as const;

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === ';') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Import competition entries from CSV text (organizer only)
export async function importCSV(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.is_organizer) {
      return res.status(403).json({ error: 'Only organizers can manage the competition schedule' });
    }

    const { eventId } = req.params;
    const { csv } = req.body;

    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    // Split into lines, skip empty
    const lines = csv.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });
    }

    // Validate header
    const headerFields = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
    const missingCols: string[] = [];
    for (const required of ['discipline', 'scheduled_date', 'scheduled_time']) {
      if (!headerFields.includes(required)) missingCols.push(required);
    }
    if (missingCols.length > 0) {
      return res.status(400).json({ error: `Missing required columns: ${missingCols.join(', ')}` });
    }

    // Map column index
    const colMap = new Map<string, number>();
    headerFields.forEach((h, i) => { if (CSV_HEADERS.includes(h as any)) colMap.set(h, i); });

    const errors: string[] = [];
    let created = 0;

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      for (const [col, idx] of colMap.entries()) {
        row[col] = fields[idx] || '';
      }

      // Basic validation
      if (!row.discipline) { errors.push(`Row ${i + 1}: discipline is required`); continue; }
      if (!row.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.scheduled_date)) { errors.push(`Row ${i + 1}: invalid date (expected YYYY-MM-DD)`); continue; }
      if (!row.scheduled_time || !/^\d{2}:\d{2}(:\d{2})?$/.test(row.scheduled_time)) { errors.push(`Row ${i + 1}: invalid time (expected HH:MM)`); continue; }
      if (!row.team_name && !row.swimmer_name) { errors.push(`Row ${i + 1}: either team_name or swimmer_name is required`); continue; }
      if (row.estimated_end_time && !/^\d{2}:\d{2}(:\d{2})?$/.test(row.estimated_end_time)) { errors.push(`Row ${i + 1}: invalid estimated_end_time (expected HH:MM)`); continue; }

      const entryId = uuidv4();
      try {
        await query(
          `INSERT INTO competition_entries (entry_id, event_id, team_name, swimmer_name, discipline, category, scheduled_date, scheduled_time, estimated_end_time, pool_location, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            entryId, eventId,
            row.team_name || null, row.swimmer_name || null,
            row.discipline, row.category || null,
            row.scheduled_date, row.scheduled_time,
            row.estimated_end_time || null, row.pool_location || null,
            row.notes || null, req.user!.user_id
          ]
        );
        created++;
      } catch (dbErr: any) {
        errors.push(`Row ${i + 1}: database error — ${dbErr.message}`);
      }
    }

    const totalRows = lines.length - 1;
    res.status(201).json({ created, total: totalRows, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
}
