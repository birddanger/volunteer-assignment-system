import { z } from 'zod';

// ── Auth schemas ──

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  first_name: z.string().min(1, 'First name is required').max(100).trim(),
  last_name: z.string().min(1, 'Last name is required').max(100).trim(),
  phone: z.string().max(20).optional().nullable(),
  swimmer_team: z.string().max(100).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  swimmer_team: z.string().max(100).optional().nullable(),
});

// ── Event schemas ──

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255).trim(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  location: z.string().min(1, 'Location is required').max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
}).refine(data => data.end_date >= data.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

// ── Session schemas ──

export const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(255).trim(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  location: z.string().max(255).optional().nullable(),
}).refine(data => data.end_time > data.start_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

// ── Task schemas ──

export const createTaskSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  title: z.string().min(1, 'Task title is required').max(255).trim(),
  description: z.string().min(1, 'Description is required').max(2000),
  instructions: z.string().max(2000).optional().nullable(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  required_volunteers: z.number().int().min(1).max(100).default(1),
}).refine(data => data.end_time > data.start_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

// ── Assignment schemas ──

export const manualAssignSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  volunteerId: z.string().uuid('Invalid volunteer ID'),
  force: z.boolean().optional(),
});

// ── Param schemas ──

export const uuidParamSchema = z.string().uuid('Invalid ID format');

// ── Competition schedule schemas ──

const emptyToNull = (val: unknown) => (val === '' ? null : val);

export const createCompetitionEntrySchema = z.object({
  team_name: z.preprocess(emptyToNull, z.string().max(255).optional().nullable()),
  swimmer_name: z.preprocess(emptyToNull, z.string().max(255).optional().nullable()),
  discipline: z.string().min(1, 'Discipline is required').max(255).trim(),
  category: z.preprocess(emptyToNull, z.string().max(255).optional().nullable()),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  estimated_end_time: z.preprocess(emptyToNull, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)').optional().nullable()),
  pool_location: z.preprocess(emptyToNull, z.string().max(255).optional().nullable()),
  notes: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
}).refine(data => data.team_name || data.swimmer_name, {
  message: 'Either team name or swimmer name is required',
  path: ['team_name'],
});

export const bulkCompetitionEntrySchema = z.object({
  entries: z.array(createCompetitionEntrySchema).min(1, 'At least one entry is required').max(500),
});
