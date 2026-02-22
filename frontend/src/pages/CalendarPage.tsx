import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event, CompetitionEntry } from '../types';

const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_FI = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_FI = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

// Generate a consistent color for each event based on its index
const EVENT_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', dot: 'bg-teal-500' },
];

function parseDate(dateStr: string): Date {
  // Handle both "YYYY-MM-DD" and ISO strings
  const parts = dateStr.split('T')[0].split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { language, t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Competition schedule toggle
  const [showCompetition, setShowCompetition] = useState(() =>
    localStorage.getItem('calendarShowCompetition') === 'true'
  );
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>([]);
  const [competitionLoading, setCompetitionLoading] = useState(false);

  const monthNames = language === 'fi' ? MONTH_NAMES_FI : MONTH_NAMES_EN;
  const dayNames = language === 'fi' ? DAY_NAMES_FI : DAY_NAMES_EN;

  useEffect(() => {
    async function load() {
      try {
        const list = await apiClient.listEvents();
        setEvents(list);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load competition entries for all events whenever toggle is turned on
  const loadCompetitionEntries = useCallback(async (eventList: Event[]) => {
    if (eventList.length === 0) return;
    setCompetitionLoading(true);
    try {
      const results = await Promise.all(
        eventList.map(ev => apiClient.listCompetitionEntries(ev.event_id).catch(() => [] as CompetitionEntry[]))
      );
      setCompetitionEntries(results.flat());
    } finally {
      setCompetitionLoading(false);
    }
  }, []);

  // When toggle is switched on and events are already loaded, fetch entries
  useEffect(() => {
    localStorage.setItem('calendarShowCompetition', String(showCompetition));
    if (showCompetition && events.length > 0 && competitionEntries.length === 0) {
      loadCompetitionEntries(events);
    }
  }, [showCompetition, events]);

  // Reload entries when events finish loading and toggle is on
  useEffect(() => {
    if (!loading && showCompetition && events.length > 0 && competitionEntries.length === 0) {
      loadCompetitionEntries(events);
    }
  }, [loading]);

  // Build a map of date -> events for the current month
  const eventsByDate = new Map<string, { event: Event; colorIdx: number }[]>();
  events.forEach((event, idx) => {
    const start = parseDate(event.start_date);
    const end = parseDate(event.end_date);
    const colorIdx = idx % EVENT_COLORS.length;

    // Iterate through each day of the event
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = formatDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      if (!eventsByDate.has(key)) eventsByDate.set(key, []);
      eventsByDate.get(key)!.push({ event, colorIdx });
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  // Build a map of date -> competition entries
  const competitionByDate = new Map<string, CompetitionEntry[]>();
  if (showCompetition) {
    competitionEntries.forEach(entry => {
      const key = entry.scheduled_date.split('T')[0];
      if (!competitionByDate.has(key)) competitionByDate.set(key, []);
      competitionByDate.get(key)!.push(entry);
    });
  }

  // Calendar grid calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // Monday = 0, Sunday = 6
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
  };

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const navigateToEvent = (eventId: string) => {
    if (user?.is_organizer) {
      navigate(`/admin?event=${eventId}`);
    } else {
      navigate(`/dashboard?event=${eventId}`);
    }
  };

  if (loading) return <div className="container">{t.common.loading}</div>;

  // Build calendar cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="container max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{t.nav.calendar}</h1>
          {/* Competition schedule toggle */}
          <button
            onClick={() => setShowCompetition(v => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              showCompetition
                ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-300'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 hover:text-amber-700'
            }`}
            title={showCompetition
              ? (language === 'fi' ? 'Piilota kilpailuaikataulu' : 'Hide competition schedule')
              : (language === 'fi' ? 'Näytä kilpailuaikataulu' : 'Show competition schedule')}
          >
            🏊 {language === 'fi' ? 'Kilpailuaikataulu' : 'Event Schedule'}
            {competitionLoading && <span className="animate-spin text-xs">⟳</span>}
            <span className={`text-xs font-bold ${ showCompetition ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400' }`}>
              {showCompetition ? '●' : '○'}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg">←</button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg">→</button>
          <button onClick={goToToday} className="btn-secondary text-sm ml-2">
            {language === 'fi' ? 'Tänään' : 'Today'}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {dayNames.map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dateKey = day ? formatDateKey(currentYear, currentMonth, day) : '';
            const dayEvents = day ? (eventsByDate.get(dateKey) || []) : [];
            const dayCompetition = day && showCompetition ? (competitionByDate.get(dateKey) || []) : [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1.5 ${
                  day ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm mb-1 ${
                      isToday
                        ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold'
                        : 'text-gray-700 dark:text-gray-300 pl-1'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.map(({ event, colorIdx }, j) => {
                        const color = EVENT_COLORS[colorIdx];
                        return (
                          <div
                            key={`${event.event_id}-${j}`}
                            onClick={() => navigateToEvent(event.event_id)}
                            className={`text-xs px-1.5 py-0.5 rounded ${color.bg} ${color.text} truncate border-l-2 ${color.border} cursor-pointer hover:opacity-80 transition-opacity`}
                            title={`${event.name}\n${event.start_date} → ${event.end_date}\n📍 ${event.location}\n${language === 'fi' ? 'Klikkaa nähdäksesi' : 'Click to view'}`}
                          >
                            {event.name}
                          </div>
                        );
                      })}
                      {dayCompetition.map((entry, j) => (
                        <div
                          key={`comp-${entry.entry_id}-${j}`}
                          onClick={() => navigate('/competition')}
                          className="text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 truncate border-l-2 border-amber-400 cursor-pointer hover:opacity-80 transition-opacity"
                          title={[
                            entry.scheduled_time?.slice(0, 5),
                            entry.discipline,
                            entry.team_name && `🏊 ${entry.team_name}`,
                            entry.swimmer_name && `👤 ${entry.swimmer_name}`,
                            entry.category,
                            entry.pool_location && `📍 ${entry.pool_location}`,
                          ].filter(Boolean).join(' · ')}
                        >
                          🏊 {entry.scheduled_time?.slice(0, 5)} {entry.discipline}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competition schedule legend */}
      {showCompetition && competitionEntries.length > 0 && (() => {
        // Collect unique teams/disciplines for this month
        const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const monthEntries = competitionEntries.filter(e => e.scheduled_date.startsWith(monthStr));
        if (monthEntries.length === 0) return null;
        const teams = [...new Set(monthEntries.map(e => e.team_name).filter(Boolean))];
        const totalThisMonth = monthEntries.length;
        return (
          <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                🏊 {language === 'fi' ? 'Kilpailuaikataulu' : 'Competition Schedule'}
                <span className="ml-2 font-normal text-amber-600 dark:text-amber-400">({totalThisMonth} {language === 'fi' ? 'merkintää' : 'entries'})</span>
              </h3>
              <button
                onClick={() => navigate('/competition')}
                className="ml-auto text-xs text-amber-700 dark:text-amber-400 underline hover:no-underline"
              >
                {language === 'fi' ? 'Näytä kaikki →' : 'View all →'}
              </button>
            </div>
            {teams.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {language === 'fi' ? 'Joukkueet: ' : 'Teams: '}{teams.join(', ')}
              </p>
            )}
          </div>
        );
      })()}

      {/* Event Legend */}
      {events.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">
            {language === 'fi' ? 'Tapahtumat' : 'Events'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.map((event, idx) => {
              const color = EVENT_COLORS[idx % EVENT_COLORS.length];
              return (
                <div key={event.event_id} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors" onClick={() => navigateToEvent(event.event_id)}>
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${color.dot}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{event.name}</p>
                    <p className="text-sm text-gray-500">
                      📅 {event.start_date} {t.common.to} {event.end_date} • 📍 {event.location}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
