import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { Task, Assignment, Session } from '../types';
import { formatDateLabel, formatTime } from '../utils/dateFormat';

interface TimelineViewProps {
  sessions: Session[];
  tasks: Task[];
  assignments: Assignment[];
  selectedDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  onSignUp: (taskId: string) => void;
  onCancelSignUp: (assignmentId: string) => void;
}

// Time constants
const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function fillColor(assigned: number, required: number): { bg: string; border: string; text: string } {
  const ratio = assigned / required;
  if (ratio >= 1) return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-400 dark:border-emerald-600', text: 'text-emerald-700 dark:text-emerald-300' };
  if (ratio >= 0.5) return { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-400 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-300' };
  return { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-400 dark:border-red-600', text: 'text-red-700 dark:text-red-300' };
}

// formatDateLabel imported from ../utils/dateFormat

export default function TimelineView({
  sessions,
  tasks,
  assignments,
  selectedDate,
  availableDates,
  onDateChange,
  onSignUp,
  onCancelSignUp,
}: TimelineViewProps) {
  const { t, language } = useI18n();
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Filter sessions and tasks for the selected date
  const daySessions = useMemo(() => {
    return sessions.filter(s => {
      const sessionDate = s.date?.split('T')[0];
      return sessionDate === selectedDate;
    });
  }, [sessions, selectedDate]);

  const dayTasks = useMemo(() => {
    const sessionIds = new Set(daySessions.map(s => s.session_id));
    return tasks.filter(t => sessionIds.has(t.session_id));
  }, [tasks, daySessions]);

  // Get unique locations from sessions (columns)
  const locations = useMemo(() => {
    const locs = new Map<string, string[]>(); // location -> session_ids
    daySessions.forEach(s => {
      const loc = s.location || t.hub.unknownLocation;
      if (!locs.has(loc)) locs.set(loc, []);
      locs.get(loc)!.push(s.session_id);
    });
    return locs;
  }, [daySessions, t]);

  const locationList = useMemo(() => Array.from(locations.keys()), [locations]);

  // Map assignment task_ids for quick lookup
  const myTaskIds = useMemo(() => new Set(assignments.map(a => a.task_id)), [assignments]);
  const assignmentByTask = useMemo(() => {
    const m = new Map<string, Assignment>();
    assignments.forEach(a => m.set(a.task_id, a));
    return m;
  }, [assignments]);

  // Generate hour labels
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) h.push(i);
    return h;
  }, []);

  // Position a task block
  const getTaskStyle = (task: Task) => {
    const startMins = timeToMinutes(task.start_time || '08:00');
    const endMins = timeToMinutes(task.end_time || '09:00');
    const topOffset = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;
    return {
      top: `${Math.max(0, topOffset)}px`,
      height: `${Math.max(HOUR_HEIGHT / 2, height)}px`,
    };
  };

  // Group tasks by location
  const tasksByLocation = useMemo(() => {
    const m = new Map<string, Task[]>();
    locationList.forEach(loc => m.set(loc, []));

    dayTasks.forEach(task => {
      const session = daySessions.find(s => s.session_id === task.session_id);
      const loc = session?.location || t.hub.unknownLocation;
      if (!m.has(loc)) m.set(loc, []);
      m.get(loc)!.push(task);
    });
    return m;
  }, [dayTasks, daySessions, locationList, t]);

  // Personal schedule: my assignments for this date
  const myDayAssignments = useMemo(() => {
    return assignments.filter(a => {
      const aDate = a.date?.split('T')[0];
      return aDate === selectedDate;
    }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [assignments, selectedDate]);

  const colCount = Math.max(locationList.length, 1);

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {availableDates.map(date => (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              date === selectedDate
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {formatDateLabel(date, language)}
          </button>
        ))}
      </div>

      {dayTasks.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          {t.hub.noTasksOnDate}
        </div>
      ) : (
        <>
          {/* Timeline grid */}
          <div className="card p-0 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Location headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                <div className="w-16 flex-shrink-0 p-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                  {t.common.time}
                </div>
                {locationList.map(loc => (
                  <div
                    key={loc}
                    className="flex-1 p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 text-center border-l border-gray-200 dark:border-gray-700"
                    style={{ minWidth: `${Math.max(180, 600 / colCount)}px` }}
                  >
                    📍 {loc}
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="flex relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
                {/* Hour labels */}
                <div className="w-16 flex-shrink-0 relative">
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute w-full text-right pr-2 text-xs text-gray-400 dark:text-gray-500 -translate-y-1/2"
                      style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Location columns */}
                {locationList.map(loc => (
                  <div
                    key={loc}
                    className="flex-1 relative border-l border-gray-200 dark:border-gray-700"
                    style={{ minWidth: `${Math.max(180, 600 / colCount)}px` }}
                  >
                    {/* Hour gridlines */}
                    {hours.map(h => (
                      <div
                        key={h}
                        className="absolute w-full border-t border-gray-100 dark:border-gray-800"
                        style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
                      />
                    ))}

                    {/* Task blocks */}
                    {(tasksByLocation.get(loc) || []).map(task => {
                      const style = getTaskStyle(task);
                      const assigned = task.assigned_count || 0;
                      const required = task.required_volunteers;
                      const isMine = myTaskIds.has(task.task_id);
                      const isFull = assigned >= required;
                      const colors = fillColor(assigned, required);
                      const isHovered = hoveredTask === task.task_id;

                      return (
                        <div
                          key={task.task_id}
                          className={`absolute left-1 right-1 rounded-lg border-2 p-2 cursor-pointer transition-all ${colors.bg} ${colors.border} ${
                            isMine ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''
                          } ${isHovered ? 'shadow-lg scale-[1.02] z-20' : 'z-10'}`}
                          style={style}
                          onMouseEnter={() => setHoveredTask(task.task_id)}
                          onMouseLeave={() => setHoveredTask(null)}
                        >
                          <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-start justify-between gap-1">
                              <span className={`text-sm font-semibold ${colors.text} truncate`}>
                                {isMine && '✓ '}{task.title}
                              </span>
                              <span className={`text-xs font-medium whitespace-nowrap ${colors.text}`}>
                                {assigned}/{required}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {formatTime(task.start_time)}–{formatTime(task.end_time)}
                            </div>
                            {/* Fill bar */}
                            <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFull ? 'bg-emerald-500' : assigned > 0 ? 'bg-amber-500' : 'bg-red-400'
                                }`}
                                style={{ width: `${Math.min(100, (assigned / required) * 100)}%` }}
                              />
                            </div>
                            {/* Action button */}
                            {isHovered && (
                              <div className="mt-auto pt-1">
                                {isMine ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onCancelSignUp(assignmentByTask.get(task.task_id)!.assignment_id); }}
                                    className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                                  >
                                    {t.volunteerDashboard.cancelSignUp}
                                  </button>
                                ) : !isFull ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onSignUp(task.task_id); }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                  >
                                    {t.volunteerDashboard.signUp}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">{t.hub.full}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal schedule strip */}
          {myDayAssignments.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                {t.hub.yourSchedule}
              </h3>
              <div className="space-y-2">
                {myDayAssignments.map(a => {
                  const startMins = timeToMinutes(a.start_time || '08:00');
                  const endMins = timeToMinutes(a.end_time || '09:00');
                  const totalDayMins = (END_HOUR - START_HOUR) * 60;
                  const leftPct = ((startMins - START_HOUR * 60) / totalDayMins) * 100;
                  const widthPct = ((endMins - startMins) / totalDayMins) * 100;

                  return (
                    <div key={a.assignment_id} className="flex items-center gap-3">
                      <div className="flex-1 relative h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center"
                          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 5)}%` }}
                        >
                          <span className="text-[10px] font-medium text-white truncate px-2">
                            {formatTime(a.start_time || '')}–{formatTime(a.end_time || '')}
                          </span>
                        </div>
                      </div>
                      <div className="w-48 text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{a.title}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">· {a.location}</span>
                      </div>
                      <button
                        onClick={() => onCancelSignUp(a.assignment_id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                      >
                        {t.hub.cancelBtn}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
