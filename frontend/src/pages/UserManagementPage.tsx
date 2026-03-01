import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import apiClient from '../services/apiClient';
import { formatDate } from '../utils/dateFormat';

interface ManagedUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  swimmer_team?: string;
  is_organizer: boolean;
  email_verified: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '', password: '', first_name: '', last_name: '',
    phone: '', swimmer_team: '', is_organizer: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await apiClient.listUsers();
      setUsers(data);
    } catch {
      setError(t.userManagement.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(targetUser: ManagedUser) {
    const newRole = !targetUser.is_organizer;
    const confirmMsg = newRole
      ? t.userManagement.confirmGrantAdmin.replace('{name}', `${targetUser.first_name} ${targetUser.last_name}`)
      : t.userManagement.confirmRevokeAdmin.replace('{name}', `${targetUser.first_name} ${targetUser.last_name}`);

    if (!window.confirm(confirmMsg)) return;

    try {
      setToggling(targetUser.user_id);
      const updated = await apiClient.updateUserRole(targetUser.user_id, newRole);
      setUsers(prev => prev.map(u => u.user_id === updated.user_id ? updated : u));
      setSuccessMsg(
        newRole
          ? t.userManagement.adminGranted.replace('{name}', `${targetUser.first_name} ${targetUser.last_name}`)
          : t.userManagement.adminRevoked.replace('{name}', `${targetUser.first_name} ${targetUser.last_name}`)
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || t.userManagement.updateFailed;
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setToggling(null);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const newUser = await apiClient.adminCreateUser({
        email: createForm.email,
        password: createForm.password,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        phone: createForm.phone || undefined,
        swimmer_team: createForm.swimmer_team || undefined,
        is_organizer: createForm.is_organizer,
      });
      setUsers(prev => [newUser, ...prev]);
      setSuccessMsg(t.userManagement.userCreated.replace('{name}', `${newUser.first_name} ${newUser.last_name}`));
      setCreateForm({ email: '', password: '', first_name: '', last_name: '', phone: '', swimmer_team: '', is_organizer: false });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || t.userManagement.createFailed;
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setCreating(false);
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      (u.swimmer_team || '').toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter(u => u.is_organizer).length;
  const volunteerCount = users.filter(u => !u.is_organizer).length;

  if (!user?.is_organizer) return null;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t.userManagement.title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {t.userManagement.subtitle}
      </p>

      {/* Error / Success banners */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          {successMsg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.userManagement.totalUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adminCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.userManagement.admins}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{volunteerCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.userManagement.volunteers}</p>
        </div>
      </div>

      {/* Create User Toggle + Form */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary text-sm"
        >
          {showCreateForm ? '✕ ' + t.eventSetup.cancel : '+ ' + t.userManagement.createUser}
        </button>

        {showCreateForm && (
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.userManagement.createUser}
            </h3>
            <form onSubmit={handleCreateUser}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.registerPage.firstName} *
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={createForm.first_name}
                    onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.registerPage.lastName} *
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={createForm.last_name}
                    onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.common.email} *
                  </label>
                  <input
                    type="email"
                    className="input w-full"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.userManagement.setPassword} *
                  </label>
                  <input
                    type="password"
                    className="input w-full"
                    value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.common.phone}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.registerPage.swimmerTeam}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={createForm.swimmer_team}
                    onChange={e => setCreateForm({ ...createForm, swimmer_team: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.is_organizer}
                    onChange={e => setCreateForm({ ...createForm, is_organizer: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {t.userManagement.makeAdmin}
                </label>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary disabled:opacity-50"
                >
                  {creating ? t.userManagement.creating : t.userManagement.createUserBtn}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t.userManagement.searchPlaceholder}
          className="input w-full max-w-md"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{t.common.loading}</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t.userManagement.name}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t.common.email}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t.userManagement.team}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t.userManagement.role}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t.userManagement.registered}</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t.userManagement.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">{t.userManagement.noUsers}</td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isSelf = u.user_id === user?.user_id;
                  return (
                    <tr key={u.user_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${u.is_organizer ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {u.first_name} {u.last_name}
                              {isSelf && <span className="ml-1 text-xs text-gray-400">({t.userManagement.you})</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{u.swimmer_team || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.is_organizer
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {u.is_organizer ? t.userManagement.admin : t.userManagement.volunteer}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <button
                            onClick={() => toggleRole(u)}
                            disabled={toggling === u.user_id}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                              u.is_organizer
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                            }`}
                          >
                            {toggling === u.user_id
                              ? '...'
                              : u.is_organizer
                                ? t.userManagement.revokeAdmin
                                : t.userManagement.grantAdmin}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
