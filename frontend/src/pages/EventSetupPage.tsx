import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { Event, Session, Task, EventTemplate, EventVisibility } from '../types';
import { formatDate, formatTime } from '../utils/dateFormat';

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

  // Visibility state
  const [visibilityMode, setVisibilityMode] = useState<EventVisibility>('public');
  const [inviteCode, setInviteCode] = useState('');
  const [invitedTeams, setInvitedTeams] = useState<string[]>([]);
  const [newTeamInput, setNewTeamInput] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [visibilityMsg, setVisibilityMsg] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

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

  // Load visibility settings when event is selected
  useEffect(() => {
    if (selectedEvent) {
      loadVisibility(selectedEvent);
    }
  }, [selectedEvent]);

  const loadVisibility = async (eventId: string) => {
    try {
      const data = await apiClient.getEventVisibility(eventId);
      setVisibilityMode(data.visibility || 'public');
      setInviteCode(data.invite_code || '');
      setInvitedTeams(data.invited_teams || []);
      setMemberCount(data.member_count || 0);
    } catch {
      // Non-fatal — visibility might not be set yet
      setVisibilityMode('public');
      setInviteCode('');
      setInvitedTeams([]);
      setMemberCount(0);
    }
  };

  const handleSaveVisibility = async () => {
    if (!selectedEvent) return;
    setVisibilityLoading(true);
    setVisibilityMsg('');
    try {
      const result = await apiClient.updateEventVisibility(selectedEvent, visibilityMode, invitedTeams);
      setInviteCode(result.invite_code || '');
      setVisibilityMsg(t.eventAccess.settingsSaved);
      setTimeout(() => setVisibilityMsg(''), 3000);
    } catch {
      setVisibilityMsg(t.eventAccess.settingsFailed);
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleAddTeam = () => {
    const team = newTeamInput.trim();
    if (team && !invitedTeams.includes(team)) {
      setInvitedTeams([...invitedTeams, team]);
      setNewTeamInput('');
    }
  };

  const handleRemoveTeam = (team: string) => {
    setInvitedTeams(invitedTeams.filter(t => t !== team));
  };

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
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(event.start_date)} {t.common.to} {formatDate(event.end_date)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
                      {event.visibility && event.visibility !== 'public' && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                          🔒 {event.visibility === 'invite_code' ? t.eventAccess.inviteCode : event.visibility === 'teams_only' ? t.eventAccess.teamsOnly : t.eventAccess.codeOrTeams}
                        </span>
                      )}
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

          {/* Visibility Settings Panel */}
          {selectedEvent && (
            <div className="card md:col-span-2">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t.eventAccess.visibilitySettings}</h2>
              <div className="space-y-4">
                {/* Visibility Mode Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { value: 'public', label: t.eventAccess.public, desc: t.eventAccess.publicDesc, icon: '🌍' },
                    { value: 'invite_code', label: t.eventAccess.inviteCode, desc: t.eventAccess.inviteCodeDesc, icon: '🔑' },
                    { value: 'teams_only', label: t.eventAccess.teamsOnly, desc: t.eventAccess.teamsOnlyDesc, icon: '👥' },
                    { value: 'code_or_teams', label: t.eventAccess.codeOrTeams, desc: t.eventAccess.codeOrTeamsDesc, icon: '🔑👥' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibilityMode(opt.value as EventVisibility)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        visibilityMode === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg mb-1">{opt.icon}</div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{opt.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Invite Code Display */}
                {(visibilityMode === 'invite_code' || visibilityMode === 'code_or_teams') && inviteCode && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.eventAccess.inviteCodeLabel}:</span>
                    <code className="text-lg font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">{inviteCode}</code>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {codeCopied ? `✓ ${t.eventAccess.codeCopied}` : `📋 ${t.eventAccess.copyCode}`}
                    </button>
                  </div>
                )}

                {/* Invited Teams */}
                {(visibilityMode === 'teams_only' || visibilityMode === 'code_or_teams') && (
                  <div>
                    <label className="label">{t.eventAccess.invitedTeams}</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={newTeamInput}
                        onChange={(e) => setNewTeamInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTeam(); } }}
                        placeholder={t.eventAccess.teamPlaceholder}
                      />
                      <button type="button" onClick={handleAddTeam} className="btn-secondary text-sm whitespace-nowrap">
                        + {t.eventAccess.addTeam}
                      </button>
                    </div>
                    {invitedTeams.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {invitedTeams.map(team => (
                          <span key={team} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                            {team}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(team)}
                              className="text-purple-400 hover:text-red-500 dark:hover:text-red-400 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Member count + Save */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t.eventAccess.memberCount.replace('{count}', String(memberCount))}
                  </span>
                  <div className="flex items-center gap-3">
                    {visibilityMsg && (
                      <span className={`text-sm ${visibilityMsg.includes('Failed') || visibilityMsg.includes('epäonnistui') ? 'text-red-600' : 'text-green-600'}`}>
                        {visibilityMsg}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveVisibility}
                      className="btn-primary text-sm"
                      disabled={visibilityLoading}
                    >
                      {visibilityLoading ? t.eventSetup.creating : '💾 ' + t.eventAccess.visibilitySettings}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      {event.name} ({formatDate(event.start_date)} {t.common.to} {formatDate(event.end_date)})
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
                  <p className="text-sm text-gray-600">{formatDate(session.date)} • {formatTime(session.start_time)}-{formatTime(session.end_time)}</p>
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
                      {event.name} ({formatDate(event.start_date)} {t.common.to} {formatDate(event.end_date)})
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
                      {session.name} — {formatDate(session.date)} ({formatTime(session.start_time)}–{formatTime(session.end_time)})
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
                      <p className="text-sm text-blue-600">{task.session_name} — {formatDate(task.date || '')}</p>
                    )}
                    <p className="text-sm text-gray-600">{formatTime(task.start_time)}–{formatTime(task.end_time)}</p>
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
