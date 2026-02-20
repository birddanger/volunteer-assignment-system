import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event } from '../types';

// ---------- Sub-tab types ----------
type AdminTab = 'overview' | 'manage' | 'print';

// ---------- Fill-rate bar component ----------
function FillBar({ filled, total, label }: { filled: number; total: number; label?: string }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{label}</span><span>{filled}/{total} ({pct}%)</span></div>}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div className={`${color} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ---------- Donut chart (pure SVG) ----------
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const size = 120;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {data.map((d, i) => {
        const pct = d.value / total;
        const dash = pct * circumference;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-currentOffset}
            className="transition-all duration-500"
          />
        );
      })}
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="text-xl font-bold fill-gray-800 dark:fill-gray-200">{total}</text>
    </svg>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [searchParams] = useSearchParams();
  const [dashboard, setDashboard] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

  // Drag-and-drop state
  const [draggedVolunteer, setDraggedVolunteer] = useState<any>(null);
  const [dragOverTask, setDragOverTask] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const eventList = await apiClient.listEvents();
        setEvents(eventList);
        const urlEvent = searchParams.get('event');
        if (urlEvent && eventList.some((e: Event) => e.event_id === urlEvent)) {
          setSelectedEvent(urlEvent);
        } else if (eventList.length > 0) {
          setSelectedEvent(eventList[0].event_id);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || t.adminDashboard.failedToLoadEvents);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      const [data, vols, assigns] = await Promise.all([
        apiClient.getAdminDashboard(selectedEvent),
        apiClient.getVolunteers(),
        apiClient.getTaskAssignments(selectedEvent),
      ]);
      setDashboard(data);
      setVolunteers(vols);
      setTaskAssignments(assigns);
    } catch (err: any) {
      setError(err.response?.data?.error || t.adminDashboard.failedToLoadDashboard);
    }
  }, [selectedEvent]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleExport = async () => {
    if (!selectedEvent) return;
    try {
      const csv = await apiClient.exportCSV(selectedEvent);
      const url = window.URL.createObjectURL(csv);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assignments-${selectedEvent}.csv`;
      a.click();
    } catch (err: any) {
      setError(err.response?.data?.error || t.adminDashboard.failedToExport);
    }
  };

  // ------ Drag-and-drop handlers ------
  const handleDragStart = (vol: any) => {
    setDraggedVolunteer(vol);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    setDragOverTask(taskId);
  };

  const handleDragLeave = () => {
    setDragOverTask(null);
  };

  const handleDrop = async (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    setDragOverTask(null);
    if (!draggedVolunteer) return;

    try {
      await apiClient.manualAssign(taskId, draggedVolunteer.user_id, true);
      await loadDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign volunteer');
    }
    setDraggedVolunteer(null);
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      await apiClient.unassign(assignmentId);
      await loadDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to unassign');
    }
  };

  // ------ Print handler ------
  const handlePrint = () => {
    window.print();
  };

  // ------ Filter logic ------
  const getFilteredTasks = () => {
    if (!dashboard) return [];
    let tasks = [...dashboard.tasks];
    if (statusFilter) {
      tasks = tasks.filter((t: any) => t.status === statusFilter);
    }
    if (sessionFilter) {
      tasks = tasks.filter((t: any) => t.session_id === sessionFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      // Also search in assigned volunteer names
      tasks = tasks.filter((t: any) => {
        if (t.title.toLowerCase().includes(q) || t.session_name.toLowerCase().includes(q)) return true;
        const assignedVols = taskAssignments.filter((a: any) => a.task_id === t.task_id);
        return assignedVols.some((a: any) =>
          `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
        );
      });
    }
    return tasks;
  };

  // Get unique sessions from dashboard tasks
  const getUniqueSessions = () => {
    if (!dashboard) return [];
    const seen = new Map<string, string>();
    dashboard.tasks.forEach((t: any) => {
      if (!seen.has(t.session_id)) seen.set(t.session_id, t.session_name);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  };

  if (!user?.is_organizer) {
    return <div className="container text-red-600">{t.common.accessDenied} {t.common.organizersOnly}</div>;
  }

  if (loading) return <div className="container">{t.common.loading}</div>;

  const filteredTasks = getFilteredTasks();

  return (
    <div className="container">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">{t.adminDashboard.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t.adminDashboard.subtitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Event Selector */}
      {events.length > 0 && (
        <div className="card mb-6">
          <label className="label">{t.adminDashboard.selectEvent}</label>
          <select
            className="input max-w-md"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {events.map(event => (
              <option key={event.event_id} value={event.event_id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-tabs */}
      {dashboard && (
        <>
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit print:hidden">
            {(['overview', 'manage', 'print'] as AdminTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {t.adminDashboard[tab]}
              </button>
            ))}
          </div>

          {/* ========== OVERVIEW TAB ========== */}
          {activeTab === 'overview' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t.adminDashboard.totalTasks}</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.summary.total_tasks}</p>
                </div>
                <div className="card text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t.adminDashboard.totalVolunteers}</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.summary.total_volunteers}</p>
                </div>
                <div className="card text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t.adminDashboard.totalAssignments}</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.summary.total_assignments}</p>
                </div>
                <div className="card text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t.adminDashboard.fillRate}</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.summary.fill_rate}%</p>
                  <FillBar filled={dashboard.summary.filled_slots} total={dashboard.summary.total_slots} />
                </div>
              </div>

              {/* Task Status Donut + Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="card">
                  <h3 className="font-semibold mb-4">{t.adminDashboard.taskStatus}</h3>
                  <DonutChart data={[
                    { label: t.adminDashboard.filled, value: dashboard.summary.filled_tasks, color: '#22c55e' },
                    { label: t.adminDashboard.partiallyFilled, value: dashboard.summary.partial_tasks, color: '#eab308' },
                    { label: t.adminDashboard.open, value: dashboard.summary.open_tasks, color: '#ef4444' },
                  ]} />
                  <div className="flex justify-center gap-6 mt-4">
                    {[
                      { label: t.adminDashboard.filled, value: dashboard.summary.filled_tasks, color: 'bg-green-500' },
                      { label: t.adminDashboard.partiallyFilled, value: dashboard.summary.partial_tasks, color: 'bg-yellow-500' },
                      { label: t.adminDashboard.open, value: dashboard.summary.open_tasks, color: 'bg-red-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="dark:text-gray-300">{item.label}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Overview */}
                <div className="card">
                  <h3 className="font-semibold mb-4">{t.adminDashboard.sessionOverview}</h3>
                  <div className="space-y-4">
                    {dashboard.sessionStats?.map((session: any) => (
                      <div key={session.session_id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm dark:text-gray-200">{session.session_name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {session.date} • {session.total_tasks} {t.adminDashboard.tasks}
                          </span>
                        </div>
                        <FillBar
                          filled={parseInt(session.filled_slots) || 0}
                          total={parseInt(session.total_slots) || 0}
                          label={`${session.filled_slots || 0}/${session.total_slots || 0} ${t.adminDashboard.slots}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                <button onClick={handleExport} className="btn-primary">{t.adminDashboard.exportCSV}</button>
                <button onClick={handlePrint} className="btn-secondary">{t.adminDashboard.printSchedule}</button>
              </div>
            </>
          )}

          {/* ========== MANAGE TAB ========== */}
          {activeTab === 'manage' && (
            <>
              {/* Search & Filter Bar */}
              <div className="card mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      className="input"
                      placeholder={t.adminDashboard.searchPlaceholder}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">{t.adminDashboard.allStatuses}</option>
                    <option value="Filled">{t.adminDashboard.filled}</option>
                    <option value="Partially Filled">{t.adminDashboard.partiallyFilled}</option>
                    <option value="Open">{t.adminDashboard.open}</option>
                  </select>
                  <select
                    className="input"
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                  >
                    <option value="">{t.adminDashboard.allSessions}</option>
                    {getUniqueSessions().map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag-and-drop Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Volunteers Panel */}
                <div className="lg:col-span-1 print:hidden">
                  <div className="card sticky top-4">
                    <h3 className="font-semibold mb-3">{t.adminDashboard.volunteers}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.adminDashboard.dragVolunteer}</p>
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      {volunteers.map((vol: any) => (
                        <div
                          key={vol.user_id}
                          draggable
                          onDragStart={() => handleDragStart(vol)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg cursor-grab active:cursor-grabbing hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                        >
                          <div className="w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                            {vol.first_name[0]}{vol.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate dark:text-gray-200">{vol.first_name} {vol.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{vol.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks Grid */}
                <div className="lg:col-span-3">
                  {filteredTasks.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.adminDashboard.noResults}</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map((task: any) => {
                        const assigned = taskAssignments.filter((a: any) => a.task_id === task.task_id);
                        const isOver = dragOverTask === task.task_id;
                        const isFull = parseInt(task.assigned_count) >= task.required_volunteers;

                        return (
                          <div
                            key={task.task_id}
                            onDragOver={(e) => !isFull && handleDragOver(e, task.task_id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !isFull && handleDrop(e, task.task_id)}
                            className={`card transition-all ${
                              isOver ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                            } ${isFull ? 'opacity-75' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold dark:text-gray-100">{task.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {task.session_name} • {task.date} • {task.start_time}–{task.end_time}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  task.status === 'Filled' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                  task.status === 'Partially Filled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                }`}>
                                  {task.assigned_count}/{task.required_volunteers}
                                </span>
                              </div>
                            </div>
                            <FillBar filled={parseInt(task.assigned_count)} total={task.required_volunteers} />

                            {/* Assigned volunteers */}
                            {assigned.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {assigned.map((a: any) => (
                                  <span
                                    key={a.assignment_id}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs"
                                  >
                                    {a.first_name} {a.last_name}
                                    <button
                                      onClick={() => handleUnassign(a.assignment_id)}
                                      className="ml-1 text-red-400 hover:text-red-600 font-bold"
                                      title="Remove"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========== PRINT TAB ========== */}
          {activeTab === 'print' && (
            <div ref={printRef}>
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold">{t.adminDashboard.printSchedule}</h2>
                <button onClick={handlePrint} className="btn-primary">{t.adminDashboard.printSchedule}</button>
              </div>

              {/* Print-optimized layout */}
              <div className="print-schedule">
                {/* Header for print */}
                <div className="hidden print:block mb-6">
                  <h1 className="text-2xl font-bold">{events.find(e => e.event_id === selectedEvent)?.name}</h1>
                  <p className="text-gray-600">
                    {events.find(e => e.event_id === selectedEvent)?.start_date} – {events.find(e => e.event_id === selectedEvent)?.end_date}
                  </p>
                </div>

                {/* Group tasks by session for print */}
                {dashboard.sessionStats?.map((session: any) => {
                  const sessionTasks = dashboard.tasks.filter((t: any) => t.session_id === session.session_id);
                  if (sessionTasks.length === 0) return null;

                  return (
                    <div key={session.session_id} className="mb-8 break-inside-avoid">
                      <h3 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-3">
                        {session.session_name} — {session.date}
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">{t.common.task}</th>
                            <th className="text-left py-2 px-2">{t.common.time}</th>
                            <th className="text-left py-2 px-2">{t.common.assigned}</th>
                            <th className="text-left py-2 px-2">{t.adminDashboard.volunteers}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionTasks.map((task: any) => {
                            const assigned = taskAssignments.filter((a: any) => a.task_id === task.task_id);
                            return (
                              <tr key={task.task_id} className="border-b border-gray-100">
                                <td className="py-2 px-2 font-medium">{task.title}</td>
                                <td className="py-2 px-2">{task.start_time}–{task.end_time}</td>
                                <td className="py-2 px-2">{task.assigned_count}/{task.required_volunteers}</td>
                                <td className="py-2 px-2">
                                  {assigned.length > 0
                                    ? assigned.map((a: any) => `${a.first_name} ${a.last_name}`).join(', ')
                                    : '—'
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                {/* Summary for print */}
                <div className="mt-8 pt-4 border-t-2 border-gray-300 print:block">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-500">{t.adminDashboard.totalTasks}</p>
                      <p className="text-2xl font-bold">{dashboard.summary.total_tasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.adminDashboard.totalVolunteers}</p>
                      <p className="text-2xl font-bold">{dashboard.summary.total_volunteers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.adminDashboard.fillRate}</p>
                      <p className="text-2xl font-bold">{dashboard.summary.fill_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
