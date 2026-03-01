import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event, Task, Assignment, Session, InAppNotification } from '../types';
import TimelineView from '../components/TimelineView';
import { formatDate, formatDateLabel, formatTime } from '../utils/dateFormat';

type ViewMode = 'hub' | 'timeline';

// ───── helpers ─────

function daysUntil(dateStr: string | undefined): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr.split('T')[0] + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function countdownLabel(days: number, t: any): string {
  if (days < 0) return t.hub.past;
  if (days === 0) return t.hub.today;
  if (days === 1) return t.hub.tomorrow;
  return t.hub.inDays.replace('{days}', String(days));
}

function fillPercent(assigned: number, required: number): number {
  if (required === 0) return 100;
  return Math.round((assigned / required) * 100);
}

function statusDot(assigned: number, required: number): string {
  const ratio = assigned / required;
  if (ratio >= 1) return 'bg-emerald-500';
  if (ratio >= 0.5) return 'bg-amber-500';
  return 'bg-red-500';
}

function relativeTime(dateStr: string, t: any): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return t.notifications.justNow;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ───── component ─────

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();

  // Data state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentEvent, setCurrentEvent] = useState<string>('');
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [view, setView] = useState<ViewMode>('hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [timelineDate, setTimelineDate] = useState<string>('');

  // ───── data loading ─────

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [eventList, myAssignments, notifs] = await Promise.all([
          apiClient.listEvents(),
          apiClient.getMyAssignments(),
          apiClient.getNotifications(5, 0).catch(() => ({ notifications: [], unreadCount: 0 })),
        ]);
        setEvents(eventList);
        setAssignments(myAssignments);
        setNotifications(notifs.notifications || []);

        const urlEvent = searchParams.get('event');
        if (urlEvent && eventList.some((e: Event) => e.event_id === urlEvent)) {
          setCurrentEvent(urlEvent);
        } else if (eventList.length > 0) {
          setCurrentEvent(eventList[0].event_id);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || t.volunteerDashboard.failedToLoad);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (!currentEvent) return;
    async function loadEventData() {
      try {
        const [available, eventSessions, eventTasks] = await Promise.all([
          apiClient.getAvailableTasks(currentEvent),
          apiClient.listSessions(currentEvent),
          apiClient.listTasks(currentEvent),
        ]);
        setAvailableTasks(available);
        setSessions(eventSessions);
        setAllTasks(eventTasks);

        // Set initial timeline date
        if (eventSessions.length > 0) {
          const dates = [...new Set(eventSessions.map((s: Session) => s.date?.split('T')[0]).filter(Boolean))].sort();
          if (dates.length > 0 && !dates.includes(timelineDate)) {
            setTimelineDate(dates[0] as string);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || t.volunteerDashboard.failedToLoad);
      }
    }
    loadEventData();
  }, [currentEvent]);

  // ───── actions ─────

  const refreshData = useCallback(async () => {
    if (!currentEvent) return;
    const [myAssignments, available, eventTasks] = await Promise.all([
      apiClient.getMyAssignments(),
      apiClient.getAvailableTasks(currentEvent),
      apiClient.listTasks(currentEvent),
    ]);
    setAssignments(myAssignments);
    setAvailableTasks(available);
    setAllTasks(eventTasks);
  }, [currentEvent]);

  const handleSignUp = async (taskId: string) => {
    try {
      setError(null);
      await apiClient.selfSignUpTask(currentEvent, taskId);
      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.error || t.volunteerDashboard.failedToSignUp);
    }
  };

  const handleCancelSignUp = async (assignmentId: string) => {
    if (!confirm(t.volunteerDashboard.cancelConfirm)) return;
    try {
      setError(null);
      await apiClient.cancelMyAssignment(assignmentId);
      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.error || t.volunteerDashboard.failedToCancel);
    }
  };

  // ───── computed values ─────

  const currentEventObj = events.find(e => e.event_id === currentEvent);

  // Upcoming assignments sorted by date
  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .filter(a => a.event_id === currentEvent || !currentEvent)
      .sort((a, b) => {
        const dA = a.date || '';
        const dB = b.date || '';
        if (dA !== dB) return dA.localeCompare(dB);
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
  }, [assignments, currentEvent]);

  // Event-level stats
  const eventStats = useMemo(() => {
    const totalAssigned = allTasks.reduce((s, t) => s + (t.assigned_count || 0), 0);
    const totalRequired = allTasks.reduce((s, t) => s + t.required_volunteers, 0);
    const fillRate = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;
    return { totalTasks: allTasks.length, totalFilled: allTasks.filter(t => (t.assigned_count || 0) >= t.required_volunteers).length, fillRate };
  }, [allTasks]);

  // Available dates for tasks
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    availableTasks.forEach(t => { if (t.date) dates.add(t.date.split('T')[0]); });
    return ['all', ...Array.from(dates).sort()];
  }, [availableTasks]);

  // Timeline dates from sessions
  const timelineDates = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach(s => { if (s.date) dates.add(s.date.split('T')[0]); });
    return Array.from(dates).sort();
  }, [sessions]);

  // Filtered & searched tasks
  const filteredTasks = useMemo(() => {
    let list = [...availableTasks].sort((a, b) => {
      const dA = a.date || '';
      const dB = b.date || '';
      if (dA !== dB) return dA.localeCompare(dB);
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
    if (filterDay !== 'all') {
      list = list.filter(t => t.date?.split('T')[0] === filterDay);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.session_name || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableTasks, filterDay, searchQuery]);

  // Personal stats
  const myStats = useMemo(() => {
    const upcoming = upcomingAssignments.filter(a => daysUntil(a.date) >= 0).length;
    const totalHours = assignments.reduce((sum, a) => {
      if (!a.start_time || !a.end_time) return sum;
      const [sh, sm] = a.start_time.split(':').map(Number);
      const [eh, em] = a.end_time.split(':').map(Number);
      return sum + (eh + em / 60) - (sh + sm / 60);
    }, 0);
    const eventIds = new Set(assignments.map(a => a.event_id).filter(Boolean));
    return { upcoming, totalHours: Math.round(totalHours * 10) / 10, totalEvents: eventIds.size };
  }, [assignments, upcomingAssignments]);

  // ───── format helpers ─────

  function fmtDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return formatDateLabel(dateStr, language);
  }

  // ───── render ─────

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto">
      {/* Header area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            👋 {t.hub.welcomeBack}, {user?.first_name}!
          </h1>
          {currentEventObj && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              🏊 {currentEventObj.name} · {formatDate(currentEventObj.start_date)} – {formatDate(currentEventObj.end_date)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Event selector */}
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

          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('hub')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'hub'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t.hub.hubView}
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'timeline'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t.hub.timelineView}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">✕</button>
        </div>
      )}

      {/* ─────────── TIMELINE VIEW ─────────── */}
      {view === 'timeline' ? (
        <TimelineView
          sessions={sessions}
          tasks={allTasks}
          assignments={assignments}
          selectedDate={timelineDate}
          availableDates={timelineDates}
          onDateChange={setTimelineDate}
          onSignUp={handleSignUp}
          onCancelSignUp={handleCancelSignUp}
        />
      ) : (
        /* ─────────── HUB VIEW ─────────── */
        <div className="space-y-6">

          {/* ── UPCOMING SECTION ── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t.hub.upcoming}
            </h2>
            {upcomingAssignments.length === 0 ? (
              <div className="card border-2 border-dashed border-gray-200 dark:border-gray-700 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">{t.volunteerDashboard.noAssignments}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAssignments.map(a => {
                  const days = daysUntil(a.date);
                  const countdown = countdownLabel(days, t);
                  const isUrgent = days >= 0 && days <= 2;

                  return (
                    <div
                      key={a.assignment_id}
                      className={`card flex items-center gap-4 py-4 transition-colors ${
                        isUrgent ? 'border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <span className="text-lg">📋</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</span>
                          {a.event_name && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">· {a.event_name}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {fmtDate(a.date)} · {formatTime(a.start_time || '')}–{formatTime(a.end_time || '')} · {a.location}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          isUrgent
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {countdown}
                        </span>
                        <button
                          onClick={() => handleCancelSignUp(a.assignment_id)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title={t.volunteerDashboard.cancelSignUp}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── OPEN TASKS SECTION ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.hub.openTasks}
              </h2>
              {/* Mini stats */}
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{eventStats.totalTasks}</span> {t.hub.tasks}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{eventStats.totalFilled}</span> {t.hub.filled}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{eventStats.fillRate}%</span> {t.hub.full}
                </span>
              </div>
            </div>

            {/* Search & filter bar */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder={t.hub.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input pl-9 text-sm"
                />
              </div>
              {availableDates.length > 2 && (
                <select
                  className="input text-sm max-w-[160px]"
                  value={filterDay}
                  onChange={e => setFilterDay(e.target.value)}
                >
                  <option value="all">{t.hub.anyDay}</option>
                  {availableDates.filter(d => d !== 'all').map(d => (
                    <option key={d} value={d}>{formatDateLabel(d, language)}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Task list */}
            {filteredTasks.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery || filterDay !== 'all' ? t.hub.noResults : t.volunteerDashboard.noAvailableTasks}
              </div>
            ) : (
              <div className="card p-0 divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredTasks.map(task => {
                  const assigned = task.assigned_count || 0;
                  const required = task.required_volunteers;

                  return (
                    <div
                      key={task.task_id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                    >
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot(assigned, required)}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{task.title}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {assigned}/{required} {t.hub.spots}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {fmtDate(task.date)} · {formatTime(task.start_time)}–{formatTime(task.end_time)} · {task.session_name}
                        </p>
                      </div>

                      {/* Fill bar */}
                      <div className="w-20 flex-shrink-0 hidden sm:block">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              assigned >= required ? 'bg-emerald-500' : assigned > 0 ? 'bg-amber-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${fillPercent(assigned, required)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleSignUp(task.task_id)}
                        className="btn-primary text-sm px-4 py-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        {t.volunteerDashboard.signUp} →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── BOTTOM GRID: STATS + NOTIFICATIONS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t.hub.yourStats}
              </h2>
              <div className="card">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{myStats.totalEvents}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.hub.events}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{myStats.totalHours}h</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.hub.totalHours}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{myStats.upcoming}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.hub.upcomingCount}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent notifications */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t.hub.recentNotifications}
              </h2>
              <div className="card">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">{t.notifications.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 4).map(n => (
                      <div key={n.id} className="flex items-start gap-2">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.is_read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{n.message}</p>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{relativeTime(n.created_at, t)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      )}
    </div>
  );
}
