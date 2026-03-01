import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event, CompetitionEntry } from '../types';
import { formatDateLabel, formatTime } from '../utils/dateFormat';

const EMPTY_FORM = {
  team_name: '',
  swimmer_name: '',
  discipline: '',
  category: '',
  scheduled_date: '',
  scheduled_time: '',
  estimated_end_time: '',
  pool_location: '',
  notes: '',
};

export default function CompetitionSchedulePage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const isOrganizer = user?.is_organizer ?? false;

  // Data
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState('');
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Import
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Highlight: team for the logged-in volunteer
  const myTeam = user?.swimmer_team;

  // Load events
  useEffect(() => {
    async function load() {
      try {
        const eventList = await apiClient.listEvents();
        setEvents(eventList);
        if (eventList.length > 0) setCurrentEvent(eventList[0].event_id);
      } catch (err: any) {
        setError(t.competition.failedToLoad);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load entries when event changes
  useEffect(() => {
    if (!currentEvent) return;
    async function loadEntries() {
      try {
        const [entryList, teamList] = await Promise.all([
          apiClient.listCompetitionEntries(currentEvent),
          apiClient.listCompetitionTeams(currentEvent).catch(() => []),
        ]);
        setEntries(entryList);
        setTeams(teamList);

        // Set default date to event start
        const event = events.find(e => e.event_id === currentEvent);
        if (event && form.scheduled_date === '') {
          setForm(f => ({ ...f, scheduled_date: event.start_date.split('T')[0] }));
        }
      } catch (err: any) {
        setError(t.competition.failedToLoad);
      }
    }
    loadEntries();
  }, [currentEvent]);

  // Available dates
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(e => dates.add(e.scheduled_date.split('T')[0]));
    return Array.from(dates).sort();
  }, [entries]);

  // Filtered entries
  const filtered = useMemo(() => {
    let list = [...entries];
    if (filterDate !== 'all') {
      list = list.filter(e => e.scheduled_date.split('T')[0] === filterDate);
    }
    if (filterTeam !== 'all') {
      list = list.filter(e => e.team_name === filterTeam);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.team_name || '').toLowerCase().includes(q) ||
        (e.swimmer_name || '').toLowerCase().includes(q) ||
        e.discipline.toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, filterDate, filterTeam, searchQuery]);

  // Group by date then time for display
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, CompetitionEntry[]>();
    filtered.forEach(e => {
      const date = e.scheduled_date.split('T')[0];
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(e);
    });
    return groups;
  }, [filtered]);

  // Current event object
  const currentEventObj = events.find(e => e.event_id === currentEvent);

  // Actions
  async function refreshEntries() {
    if (!currentEvent) return;
    const [entryList, teamList] = await Promise.all([
      apiClient.listCompetitionEntries(currentEvent),
      apiClient.listCompetitionTeams(currentEvent).catch(() => []),
    ]);
    setEntries(entryList);
    setTeams(teamList);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEvent) return;
    setSaving(true);
    setError(null);
    try {
      // Convert empty strings to undefined for optional fields
      const cleaned = {
        ...form,
        team_name: form.team_name || undefined,
        swimmer_name: form.swimmer_name || undefined,
        category: form.category || undefined,
        estimated_end_time: form.estimated_end_time || undefined,
        pool_location: form.pool_location || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await apiClient.updateCompetitionEntry(currentEvent, editingId, cleaned);
        setSuccessMsg(t.competition.entryUpdated);
      } else {
        await apiClient.createCompetitionEntry(currentEvent, cleaned);
        setSuccessMsg(t.competition.entryCreated);
      }
      await refreshEntries();
      setForm({ ...EMPTY_FORM, scheduled_date: form.scheduled_date });
      setEditingId(null);
      setShowForm(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t.competition.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry: CompetitionEntry) {
    setForm({
      team_name: entry.team_name || '',
      swimmer_name: entry.swimmer_name || '',
      discipline: entry.discipline,
      category: entry.category || '',
      scheduled_date: entry.scheduled_date.split('T')[0],
      scheduled_time: entry.scheduled_time || '',
      estimated_end_time: entry.estimated_end_time || '',
      pool_location: entry.pool_location || '',
      notes: entry.notes || '',
    });
    setEditingId(entry.entry_id);
    setShowForm(true);
  }

  async function handleDelete(entryId: string) {
    if (!confirm(t.competition.deleteConfirm)) return;
    try {
      await apiClient.deleteCompetitionEntry(currentEvent, entryId);
      await refreshEntries();
    } catch (err: any) {
      setError(err.response?.data?.error || t.competition.deleteFailed);
    }
  }

  async function handleImport() {
    if (!importFile || !currentEvent) return;
    setImporting(true);
    setError(null);
    setImportErrors([]);
    try {
      const text = await importFile.text();
      const result = await apiClient.importCompetitionCSV(currentEvent, text);
      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        setSuccessMsg(
          t.competition.importPartial
            .replace('{created}', String(result.created))
            .replace('{total}', String(result.total))
            .replace('{errorCount}', String(result.errors.length))
        );
      } else {
        setSuccessMsg(t.competition.importSuccess.replace('{count}', String(result.created)));
      }
      await refreshEntries();
      setImportFile(null);
      setShowImport(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || t.competition.importFailed);
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🏊 {t.competition.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.competition.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {events.length > 1 && (
            <select
              className="input text-sm max-w-[200px]"
              value={currentEvent}
              onChange={(e) => setCurrentEvent(e.target.value)}
            >
              {events.map(evt => (
                <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
              ))}
            </select>
          )}

          {isOrganizer && (
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ ...EMPTY_FORM, scheduled_date: currentEventObj?.start_date?.split('T')[0] || '' }); }}
              className="btn-primary text-sm"
            >
              {showForm ? t.competition.hideForm : t.competition.addEntry}
            </button>
          )}
          {isOrganizer && (
            <button
              onClick={() => setShowImport(!showImport)}
              className="btn-secondary text-sm"
            >
              📁 {t.competition.importCSV}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
          {successMsg}
        </div>
      )}

      {/* Organizer form */}
      {showForm && isOrganizer && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            {editingId ? t.competition.editEntry : t.competition.addEntry}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">{t.competition.teamName}</label>
              <input className="input" value={form.team_name} onChange={e => setForm(f => ({ ...f, team_name: e.target.value }))} placeholder={t.competition.teamNamePlaceholder} />
            </div>
            <div className="form-group">
              <label className="label">{t.competition.swimmerName}</label>
              <input className="input" value={form.swimmer_name} onChange={e => setForm(f => ({ ...f, swimmer_name: e.target.value }))} placeholder={t.competition.swimmerNamePlaceholder} />
            </div>
            <div className="form-group">
              <label className="label">{t.competition.discipline} *</label>
              <input className="input" value={form.discipline} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))} placeholder={t.competition.disciplinePlaceholder} required />
            </div>
            <div className="form-group">
              <label className="label">{t.competition.category}</label>
              <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={t.competition.categoryPlaceholder} />
            </div>
            <div className="form-group">
              <label className="label">{t.common.date} *</label>
              <input type="date" className="input" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">{t.common.startTime} *</label>
              <input type="time" className="input" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">{t.competition.estimatedEnd}</label>
              <input type="time" className="input" value={form.estimated_end_time} onChange={e => setForm(f => ({ ...f, estimated_end_time: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">{t.competition.poolLocation}</label>
              <input className="input" value={form.pool_location} onChange={e => setForm(f => ({ ...f, pool_location: e.target.value }))} placeholder={t.competition.poolLocationPlaceholder} />
            </div>
            <div className="form-group">
              <label className="label">{t.competition.notes}</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t.competition.notesPlaceholder} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t.common.loading : (editingId ? t.competition.updateBtn : t.competition.createBtn)}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM, scheduled_date: form.scheduled_date }); }}>
                  {t.eventSetup.cancel}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Import panel */}
      {showImport && isOrganizer && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
            📁 {t.competition.importFromFile}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t.competition.csvFormatHint}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/competition_schedule_template.csv"
              download="competition_schedule_template.csv"
              className="btn-secondary text-sm inline-flex items-center gap-1"
            >
              ⬇️ {t.competition.downloadTemplate}
            </a>
            <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-1">
              📄 {importFile ? importFile.name : t.competition.selectFile}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
              />
            </label>
            {importFile && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="btn-primary text-sm"
              >
                {importing ? t.competition.importing : t.competition.importBtn}
              </button>
            )}
          </div>
          {importErrors.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer font-medium">
                {t.competition.importErrors} ({importErrors.length})
              </summary>
              <ul className="mt-1 text-xs text-red-500 dark:text-red-400 space-y-0.5 max-h-40 overflow-y-auto">
                {importErrors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* My team highlight */}
      {myTeam && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 mb-4 text-sm text-blue-700 dark:text-blue-300">
          🏅 {t.competition.myTeamHint.replace('{team}', myTeam)}
          <button
            onClick={() => setFilterTeam(filterTeam === myTeam ? 'all' : myTeam)}
            className="ml-2 underline font-medium"
          >
            {filterTeam === myTeam ? t.competition.showAll : t.competition.filterMyTeam}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder={t.competition.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
        {availableDates.length > 1 && (
          <select className="input text-sm max-w-[160px]" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="all">{t.hub.anyDay}</option>
            {availableDates.map(d => (
              <option key={d} value={d}>{formatDateLabel(d, language)}</option>
            ))}
          </select>
        )}
        {teams.length > 1 && (
          <select className="input text-sm max-w-[180px]" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            <option value="all">{t.competition.allTeams}</option>
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Schedule display */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-1">{t.competition.noEntries}</p>
          <p className="text-sm">{isOrganizer ? t.competition.noEntriesOrganizerHint : t.competition.noEntriesHint}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByDate.entries()).map(([date, dayEntries]) => (
            <section key={date}>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                📅 {formatDateLabel(date, language)}
                <span className="ml-2 text-xs font-normal text-gray-400">({dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'})</span>
              </h2>
              <div className="card p-0 divide-y divide-gray-100 dark:divide-gray-700/50 overflow-hidden">
                {dayEntries.map(entry => {
                  const isMyTeam = myTeam && entry.team_name === myTeam;
                  return (
                    <div
                      key={entry.entry_id}
                      className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                        isMyTeam ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      {/* Time */}
                      <div className="w-20 flex-shrink-0 text-center">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {formatTime(entry.scheduled_time || '')}
                        </div>
                        {entry.estimated_end_time && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            – {formatTime(entry.estimated_end_time || '')}
                          </div>
                        )}
                      </div>

                      {/* Discipline & category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {entry.discipline}
                          </span>
                          {entry.category && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                              {entry.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          {entry.team_name && (
                            <span className={`${isMyTeam ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}>
                              🏊 {entry.team_name}
                            </span>
                          )}
                          {entry.swimmer_name && (
                            <span>👤 {entry.swimmer_name}</span>
                          )}
                          {entry.pool_location && (
                            <span>📍 {entry.pool_location}</span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{entry.notes}</p>
                        )}
                      </div>

                      {/* Organizer actions */}
                      {isOrganizer && (
                        <div className="flex-shrink-0 flex gap-1">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                          >
                            {t.competition.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(entry.entry_id)}
                            className="text-xs text-red-500 dark:text-red-400 hover:underline px-2 py-1"
                          >
                            {t.competition.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {entries.length > 0 && (
        <div className="mt-6 card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{entries.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.competition.totalEntries}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teams.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.competition.totalTeams}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{availableDates.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.competition.competitionDays}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {new Set(entries.map(e => e.discipline)).size}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.competition.disciplines}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
