/**
 * Shared date / time formatting utilities.
 * Target format  →  dd.mm.yyyy  and  hh:mm
 */

/** "2026-03-15" or ISO string  →  "15.03.2026" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handle ISO datetime strings by taking only the date part
  const raw = dateStr.split('T')[0];
  const [year, month, day] = raw.split('-');
  if (!year || !month || !day) return dateStr;          // fallback
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
}

/** "09:00:00" or "09:00"  →  "09:00" */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); // HH:MM
}

/** Combine date + optional time  →  "15.03.2026 09:00" */
export function formatDateTime(dateStr: string, timeStr?: string): string {
  const d = formatDate(dateStr);
  if (!timeStr) return d;
  return `${d} ${formatTime(timeStr)}`;
}

/**
 * Friendly date label including day-of-week name.
 * "2026-03-15", "en"  →  "Sun 15.03.2026"
 * Used by TimelineView and CompetitionSchedulePage.
 */
export function formatDateLabel(dateStr: string, language: string): string {
  const raw = dateStr.split('T')[0];
  const d = new Date(raw + 'T00:00:00');
  const days_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days_fi = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];
  const days = language === 'fi' ? days_fi : days_en;
  return `${days[d.getDay()]} ${formatDate(raw)}`;
}
