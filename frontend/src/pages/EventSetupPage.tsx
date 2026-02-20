import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event, Session, Task, EventTemplate } from '../types';

export default function EventSetupPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'events' | 'sessions' | 'tasks' | 'templates'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Template state
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [createFromTemplateId, setCreateFromTemplateId] = useState<string | null>(null);
  const [fromTemplateForm, setFromTemplateForm] = useState({ name: '', start_date: '', location: '' });
  const [templateMsg, setTemplateMsg] = useState('');

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
  });

  const [sessionForm, setSessionForm] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    instructions: '',
    start_time: '',
    end_time: '',
    required_volunteers: '1',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent && (tab === 'sessions' || tab === 'tasks')) {
      loadSessions(selectedEvent);
    }
    if (selectedEvent && tab === 'tasks') {
      loadTasks(selectedEvent);
    }
  }, [selectedEvent, tab]);

  const [taskSessionId, setTaskSessionId] = useState<string>('');

  // Keep taskSessionId in sync with sessions list
  useEffect(() => {
    if (sessions.length > 0 && !taskSessionId) {
      setTaskSessionId(sessions[0].session_id);
    }
  }, [sessions]);

  // Filter tasks by selected session
  const filteredTasks = taskSessionId
    ? tasks.filter(task => task.session_id === taskSessionId)
    : tasks;

  const loadEvents = async () => {
    try {
      const list = await apiClient.listEvents();
      setEvents(list);
      if (list.length > 0) setSelectedEvent(list[0].event_id);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadSessions = async (eventId: string) => {
    try {
      const list = await apiClient.listSessions(eventId);
      setSessions(list);
      if (list.length > 0) setSelectedSession(list[0].session_id);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadTasks = async (eventId: string) => {
    try {
      const list = await apiClient.listTasks(eventId);
      setTasks(list);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const list = await apiClient.listTemplates();
      setTemplates(list);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  useEffect(() => {
    if (tab === 'templates') loadTemplates();
  }, [tab]);

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !templateName.trim()) return;
    setLoading(true);
    setTemplateMsg('');
    try {
      const result = await apiClient.saveEventAsTemplate(selectedEvent, templateName.trim(), templateDesc || undefined);
      setTemplateMsg(t.eventSetup.templateSaved.replace('{sessions}', result.sessions_count).replace('{tasks}', result.tasks_count));
      setTemplateName('');
      setTemplateDesc('');
      setSaveTemplateModal(false);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      setTemplateMsg(t.eventSetup.templateSaveFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFromTemplateId) return;
    setLoading(true);
    setTemplateMsg('');
    try {
      const result = await apiClient.createEventFromTemplate(
        createFromTemplateId,
        fromTemplateForm.name,
        fromTemplateForm.start_date,
        fromTemplateForm.location
      );
      setTemplateMsg(
        t.eventSetup.eventCreatedFromTemplate
          .replace('{sessions}', result.sessions_created)
          .replace('{tasks}', result.tasks_created)
      );
      setCreateFromTemplateId(null);
      setFromTemplateForm({ name: '', start_date: '', location: '' });
      await loadEvents();
    } catch (error) {
      console.error('Failed to create from template:', error);
      setTemplateMsg(t.eventSetup.templateCreateFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm(t.eventSetup.deleteTemplateConfirm)) return;
    try {
      await apiClient.deleteTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.createEvent(
        eventForm.name,
        eventForm.start_date,
        eventForm.end_date,
        eventForm.location,
        eventForm.description
      );
      setEventForm({ name: '', start_date: '', end_date: '', location: '', description: '' });
      await loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setLoading(true);
    try {
      await apiClient.createSession(
        selectedEvent,
        sessionForm.name,
        sessionForm.date,
        sessionForm.start_time,
        sessionForm.end_time,
        sessionForm.location
      );
      setSessionForm({ name: '', date: '', start_time: '', end_time: '', location: '' });
      await loadSessions(selectedEvent);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !taskSessionId) return;
    setLoading(true);
    try {
      await apiClient.createTask(
        selectedEvent,
        taskSessionId,
        taskForm.title,
        taskForm.description,
        taskForm.start_time,
        taskForm.end_time,
        parseInt(taskForm.required_volunteers),
        taskForm.instructions
      );
      setTaskForm({ title: '', description: '', instructions: '', start_time: '', end_time: '', required_volunteers: '1' });
      await loadTasks(selectedEvent);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_organizer) {
    return <div className="container text-red-600">{t.common.accessDenied} {t.common.organizersOnly}</div>;
  }

  const tabLabels: Record<'events' | 'sessions' | 'tasks' | 'templates', string> = {
    events: t.eventSetup.events,
    sessions: t.eventSetup.sessions,
    tasks: t.eventSetup.tasks,
    templates: t.eventSetup.templates,
  };

  return (
    <div className="container">
      <h1 className="text-4xl font-bold mb-8">{t.eventSetup.title}</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {(['events', 'sessions', 'tasks', 'templates'] as const).map(tabName => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`px-4 py-2 font-medium border-b-2 ${
              tab === tabName
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            {tabLabels[tabName]}
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">{t.eventSetup.createEvent}</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="label">{t.eventSetup.eventName}</label>
                <input
                  type="text"
                  className="input"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">{t.common.startDate}</label>
                  <input
                    type="date"
                    className="input"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">{t.common.endDate}</label>
                  <input
                    type="date"
                    className="input"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">{t.common.location}</label>
                <input
                  type="text"
                  className="input"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.descriptionOptional}</label>
                <textarea
                  className="input"
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t.eventSetup.creating : t.eventSetup.createEventBtn}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">{t.eventSetup.yourEvents}</h2>
            <div className="space-y-3">
              {events.map(event => (
                <div
                  key={event.event_id}
                  onClick={() => setSelectedEvent(event.event_id)}
                  className={`p-4 rounded border cursor-pointer ${
                    selectedEvent === event.event_id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{event.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.start_date} {t.common.to} {event.end_date}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event.event_id);
                        setTemplateName(event.name);
                        setSaveTemplateModal(true);
                      }}
                      className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex-shrink-0"
                      title={t.eventSetup.saveAsTemplate}
                    >
                      📋 {t.eventSetup.saveAsTemplate}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save as Template Modal */}
          {saveTemplateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSaveTemplateModal(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.eventSetup.saveAsTemplate}</h3>
                <form onSubmit={handleSaveAsTemplate}>
                  <div className="form-group">
                    <label className="label">{t.eventSetup.templateNameLabel}</label>
                    <input
                      type="text"
                      className="input"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder={t.eventSetup.templateNamePlaceholder}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">{t.eventSetup.descriptionOptional}</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setSaveTemplateModal(false)} className="btn-secondary">
                      {t.eventSetup.cancel}
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? t.eventSetup.creating : t.eventSetup.saveTemplateBtn}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {tab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">{t.eventSetup.addSession}</h2>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label className="label">{t.eventSetup.selectEvent}</label>
                <select
                  className="input"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  required
                >
                  <option value="" disabled>— {t.eventSetup.selectEvent} —</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.name} ({event.start_date} {t.common.to} {event.end_date})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.sessionName}</label>
                <input
                  type="text"
                  className="input"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  placeholder={t.eventSetup.sessionNamePlaceholder}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t.common.date}</label>
                <input
                  type="date"
                  className="input"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">{t.common.startTime}</label>
                  <input
                    type="time"
                    className="input"
                    value={sessionForm.start_time}
                    onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">{t.common.endTime}</label>
                  <input
                    type="time"
                    className="input"
                    value={sessionForm.end_time}
                    onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.locationOptional}</label>
                <input
                  type="text"
                  className="input"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t.eventSetup.adding : t.eventSetup.addSessionBtn}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">{t.eventSetup.sessions}</h2>
            <div className="space-y-3">
              {sessions.map(session => (
                <div
                  key={session.session_id}
                  onClick={() => setSelectedSession(session.session_id)}
                  className={`p-4 rounded border cursor-pointer ${
                    selectedSession === session.session_id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <p className="font-semibold">{session.name}</p>
                  <p className="text-sm text-gray-600">{session.date} • {session.start_time}-{session.end_time}</p>
                  {session.location && <p className="text-sm text-gray-600">{session.location}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">{t.eventSetup.addTask}</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-600 mb-4">{t.eventSetup.noSessions}</p>
            ) : (
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="label">{t.eventSetup.selectEvent}</label>
                <select
                  className="input"
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    setTaskSessionId('');
                  }}
                  required
                >
                  <option value="" disabled>— {t.eventSetup.selectEvent} —</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.name} ({event.start_date} {t.common.to} {event.end_date})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.selectSession}</label>
                <select
                  className="input"
                  value={taskSessionId}
                  onChange={(e) => setTaskSessionId(e.target.value)}
                  required
                >
                  <option value="" disabled>— {t.eventSetup.selectSession} —</option>
                  {sessions.map(session => (
                    <option key={session.session_id} value={session.session_id}>
                      {session.name} — {session.date} ({session.start_time}–{session.end_time})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.taskTitle}</label>
                <input
                  type="text"
                  className="input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder={t.eventSetup.taskTitlePlaceholder}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t.common.description}</label>
                <textarea
                  className="input"
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.instructions}</label>
                <textarea
                  className="input"
                  rows={2}
                  value={taskForm.instructions}
                  onChange={(e) => setTaskForm({ ...taskForm, instructions: e.target.value })}
                  placeholder={t.eventSetup.instructionsPlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">{t.common.startTime}</label>
                  <input
                    type="time"
                    className="input"
                    value={taskForm.start_time}
                    onChange={(e) => setTaskForm({ ...taskForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">{t.common.endTime}</label>
                  <input
                    type="time"
                    className="input"
                    value={taskForm.end_time}
                    onChange={(e) => setTaskForm({ ...taskForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">{t.eventSetup.volunteersNeeded}</label>
                <input
                  type="number"
                  className="input"
                  value={taskForm.required_volunteers}
                  onChange={(e) => setTaskForm({ ...taskForm, required_volunteers: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t.eventSetup.creating : t.eventSetup.createTaskBtn}
              </button>
            </form>
            )}
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">{t.eventSetup.tasks}</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <p className="text-gray-600">{t.eventSetup.noTasks}</p>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.task_id} className="p-4 rounded border border-gray-200">
                    <p className="font-semibold">{task.title}</p>
                    {task.session_name && (
                      <p className="text-sm text-blue-600">{task.session_name} — {task.date}</p>
                    )}
                    <p className="text-sm text-gray-600">{task.start_time}–{task.end_time}</p>
                    <p className="text-sm text-gray-600">{t.common.volunteers}: {task.required_volunteers}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-6">
          {templateMsg && (
            <div className={`p-3 rounded text-sm ${templateMsg.includes('Failed') || templateMsg.includes('epäonnistui') ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
              {templateMsg}
            </div>
          )}

          {templates.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t.eventSetup.noTemplates}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t.eventSetup.noTemplatesHint}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(tmpl => (
                <div key={tmpl.template_id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{tmpl.name}</h3>
                      {tmpl.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tmpl.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.template_id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                      title={t.eventSetup.deleteTemplate}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{tmpl.sessions_count} {t.eventSetup.sessions.toLowerCase()}</span>
                    <span>{tmpl.tasks_count} {t.eventSetup.tasks.toLowerCase()}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    {new Date(tmpl.created_at).toLocaleDateString()}
                  </p>

                  {createFromTemplateId === tmpl.template_id ? (
                    <form onSubmit={handleCreateFromTemplate} className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div>
                        <label className="label text-sm">{t.eventSetup.eventName}</label>
                        <input
                          type="text"
                          className="input"
                          value={fromTemplateForm.name}
                          onChange={(e) => setFromTemplateForm({ ...fromTemplateForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label text-sm">{t.common.startDate}</label>
                        <input
                          type="date"
                          className="input"
                          value={fromTemplateForm.start_date}
                          onChange={(e) => setFromTemplateForm({ ...fromTemplateForm, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label text-sm">{t.common.location}</label>
                        <input
                          type="text"
                          className="input"
                          value={fromTemplateForm.location}
                          onChange={(e) => setFromTemplateForm({ ...fromTemplateForm, location: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-sm flex-1" disabled={loading}>
                          {loading ? t.eventSetup.creating : t.eventSetup.createEventBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCreateFromTemplateId(null); setFromTemplateForm({ name: '', start_date: '', location: '' }); }}
                          className="btn-secondary text-sm"
                        >
                          {t.eventSetup.cancel}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setCreateFromTemplateId(tmpl.template_id)}
                      className="btn-primary w-full text-sm"
                    >
                      {t.eventSetup.useTemplate}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
