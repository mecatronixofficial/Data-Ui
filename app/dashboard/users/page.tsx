'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiCheckCircle, FiKey, FiTrash2, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import { api } from '@/lib/api';

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type PasswordModal = { user: UserRow; newPassword: string; saving: boolean; error: string };

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState<PasswordModal | null>(null);

  async function load() {
    setLoading(true);
    try {
      setUsers(await api.listUsers());
    } catch (err: any) {
      setError(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.me()
      .then((user) => {
        if (user.permissions?.manageUsers) load();
        else router.replace('/dashboard');
      })
      .catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    const normalizedEmail = email.trim().toLocaleLowerCase();
    if (users.some((u) => u.email.trim().toLocaleLowerCase() === normalizedEmail)) {
      setError(`An account with the email "${normalizedEmail}" already exists.`);
      return;
    }
    try {
      await api.createUser({ name: name.trim(), email: normalizedEmail, password, role });
      setSuccess(`${role === 'admin' ? 'Admin' : 'User'} account created.`);
      setName(''); setEmail(''); setPassword(''); setRole('user');
      load();
    } catch (err: any) {
      setError(err.message || 'Could not create account');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this account?')) return;
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err: any) {
      setError(err.message || 'Could not remove account');
    }
  }

  async function handlePasswordUpdate() {
    if (!passwordModal) return;
    if (passwordModal.newPassword.length < 6) {
      setPasswordModal((m) => m && ({ ...m, error: 'Password must be at least 6 characters.' }));
      return;
    }
    setPasswordModal((m) => m && ({ ...m, saving: true, error: '' }));
    try {
      await api.updateUser(passwordModal.user._id, { password: passwordModal.newPassword });
      setPasswordModal(null);
      setSuccess(`Password updated for ${passwordModal.user.name}.`);
    } catch (err: any) {
      setPasswordModal((m) => m && ({ ...m, saving: false, error: err.message || 'Could not update password' }));
    }
  }

  const ROLE_STYLE: Record<string, string> = {
    superadmin: 'border-violet-200 bg-violet-50 text-violet-700',
    admin: 'border-blue-200 bg-blue-50 text-blue-700',
    user: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <div className="space-y-6">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-8 py-7 text-white shadow-[0_20px_50px_rgba(0,107,196,0.30)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute -left-8 -top-8 h-[180%] w-2/5 rotate-12 bg-gradient-to-br from-white/8 via-white/4 to-transparent" />
        </div>
        <div className="pointer-events-none absolute right-8 top-4 h-16 w-16 rounded-xl border border-white/10 bg-white/5 rotate-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/60">Access control</p>
            <h1 className="font-display text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-4xl">Users</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <FiUsers size={17} className="text-white" />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-white">{users.length}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-200/60">Total users</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create account form ── */}
      <form onSubmit={handleCreate}
        className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUserPlus size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Create an account</h2>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Password</label>
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit"
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2"><FiUserPlus size={15} /> Create account</span>
            </button>
          </div>
        </div>
      </form>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}
      {success && <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><FiCheckCircle />{success}</p>}

      {/* ── Users table ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUsers size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Team accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-blue-900/55">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-900/40">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                    <span className="font-mono text-xs">loading…</span>
                  </div>
                </td></tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u._id} className="border-b border-blue-50 transition last:border-0 hover:bg-blue-50/40">
                  <td className="px-5 py-4 font-medium text-blue-950">{u.name}</td>
                  <td className="px-5 py-3 text-blue-900/60">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${ROLE_STYLE[u.role] ?? ROLE_STYLE.user}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Change password */}
                      <button
                        onClick={() => setPasswordModal({ user: u, newPassword: '', saving: false, error: '' })}
                        aria-label="Change password"
                        title="Change password"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <FiKey size={14} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(u._id)}
                        aria-label="Remove user"
                        className="rounded-lg p-2 text-blue-900/30 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Change password modal ── */}
      {passwordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="pwd-modal-title"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !passwordModal.saving) setPasswordModal(null); }}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-blue-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <FiKey size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Super Admin</p>
                  <h2 id="pwd-modal-title" className="font-display text-xl text-blue-950">Change password</h2>
                </div>
              </div>
              <button onClick={() => setPasswordModal(null)} disabled={passwordModal.saving}
                aria-label="Close" className="rounded-lg p-1.5 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700">
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="mb-4 text-sm text-blue-900/60">
                Set a new password for <span className="font-semibold text-blue-950">{passwordModal.user.name}</span>.
              </p>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">New password</label>
              <input
                type="password"
                minLength={6}
                autoFocus
                value={passwordModal.newPassword}
                onChange={(e) => setPasswordModal((m) => m && ({ ...m, newPassword: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordUpdate(); }}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              />
              {passwordModal.error && (
                <p className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <FiAlertCircle size={13} />{passwordModal.error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-blue-100 px-6 py-4">
              <button onClick={() => setPasswordModal(null)} disabled={passwordModal.saving}
                className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-60">
                Cancel
              </button>
              <button onClick={handlePasswordUpdate} disabled={passwordModal.saving || passwordModal.newPassword.length < 6}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                <span className="relative flex items-center gap-2">
                  <FiCheck size={14} />
                  {passwordModal.saving ? 'Saving…' : 'Update password'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
