import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event } from '../types';

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t.nav.calendar}</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-lg">←</button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-lg">→</button>
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
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
