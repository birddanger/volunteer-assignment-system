import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { AssignmentHistoryItem, ProfileStats } from '../types';

export default function VolunteerProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [phone, setPhone] = useState(user?.phone || '');
  const [swimmerTeam, setSwimmerTeam] = useState(user?.swimmer_team || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ totalAssignments: 0, totalHours: 0, totalEvents: 0 });
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await apiClient.getAssignmentHistory();
        setHistory(data.assignments);
        setStats(data.stats);
      } catch {
        // ignore
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await apiClient.updateProfile(phone, swimmerTeam);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t.profile.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t.profile.title}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t.profile.subtitle}</p>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Stats cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalAssignments}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.profile.totalAssignments}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalHours}h</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.profile.totalHours}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalEvents}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.profile.totalEvents}</div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.profile.personalInfo}
          </h2>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile.name}
              </label>
              <input
                type="text"
                value={`${user.first_name} ${user.last_name}`}
                disabled
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.common.email}
              </label>
              <input
                type="text"
                value={user.email}
                disabled
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.common.phone}
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t.common.optional}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.registerPage.swimmerTeam}
              </label>
              <input
                type="text"
                value={swimmerTeam}
                onChange={e => setSwimmerTeam(e.target.value)}
                placeholder={t.common.optional}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">{t.profile.saved}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? t.profile.saving : t.profile.saveBtn}
            </button>
          </div>
        </form>
      </div>

      {/* Assignment History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.profile.assignmentHistory}
          </h2>
        </div>
        <div className="p-6">
          {loadingHistory ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t.common.loading}</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t.profile.noHistory}</p>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.assignment_id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    item.status === 'Confirmed' || item.status === 'Completed'
                      ? 'bg-green-500'
                      : item.status === 'Cancelled'
                      ? 'bg-red-400'
                      : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'Confirmed' || item.status === 'Completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : item.status === 'Cancelled'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.event_name} · {item.session_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDate(item.date)} · {item.start_time}–{item.end_time} · {item.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member since */}
      <div className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
        {t.profile.memberSince} {formatDate(user.created_at)}
      </div>
    </div>
  );
}
