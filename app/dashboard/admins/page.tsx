'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheckCircle, FiEdit2, FiKey, FiPower, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';
import EditAccountModal from '@/components/EditAccountModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

type AdminRow = { _id: string; name: string; email: string; role: string; isActive?: boolean };

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [resetting, setResetting] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState<AdminRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const all: AdminRow[] = await api.listUsers();
      setAdmins(all.filter((u) => u.role === 'admin'));
    } catch (err: any) {
      setError(err.message || 'Could not load admins');
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
    if (admins.some((a) => a.email.trim().toLocaleLowerCase() === normalizedEmail)) {
      setError(`An account with the email "${normalizedEmail}" already exists.`);
      return;
    }
    setCreating(true);
    try {
      await api.createUser({ name: name.trim(), email: normalizedEmail, password, role: 'admin' });
      setSuccess('Admin account created.');
      setName(''); setEmail(''); setPassword('');
      load();
    } catch (err: any) {
      setError(err.message || 'Could not create admin account');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(admin: AdminRow) {
    setError(''); setSuccess('');
    const nextActive = admin.isActive === false;
    setTogglingId(admin._id);
    try {
      await api.setAccountStatus(admin._id, nextActive);
      setAdmins((prev) => prev.map((a) => (a._id === admin._id ? { ...a, isActive: nextActive } : a)));
      setSuccess(`${admin.name} is now ${nextActive ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      setError(err.message || 'Could not update status');
    } finally {
      setTogglingId(null);
    }
  }

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
            <h1 className="font-display text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-4xl">Admins</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <FiUsers size={17} className="text-white" />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-white">{admins.length}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-200/60">Total admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create admin form ── */}
      <form onSubmit={handleCreate}
        className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUserPlus size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Create an admin</h2>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={creating}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2"><FiUserPlus size={15} /> {creating ? 'Creating…' : 'Create admin'}</span>
            </button>
          </div>
        </div>
      </form>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}
      {success && <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><FiCheckCircle />{success}</p>}

      {/* ── Admins table ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUsers size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">All admins</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-blue-900/55">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-900/40">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                    <span className="font-mono text-xs">loading…</span>
                  </div>
                </td></tr>
              )}
              {!loading && admins.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-blue-900/40">No admins yet.</td></tr>
              )}
              {!loading && admins.map((a) => (
                <tr key={a._id} className="border-b border-blue-50 transition last:border-0 hover:bg-blue-50/40">
                  <td className="px-5 py-4 font-medium text-blue-950">{a.name}</td>
                  <td className="px-5 py-3 text-blue-900/60">{a.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(a)}
                        disabled={togglingId === a._id}
                        aria-label={a.isActive === false ? 'Activate account' : 'Deactivate account'}
                        title={a.isActive === false ? 'Activate account' : 'Deactivate account'}
                        className={`flex items-center gap-1.5 rounded-lg p-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                          a.isActive === false
                            ? 'text-red-600 hover:bg-red-50 focus-visible:ring-red-300'
                            : 'text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-300'
                        }`}
                      >
                        <FiPower size={14} />
                      </button>
                      <button
                        onClick={() => setEditing(a)}
                        aria-label="Edit profile" title="Edit profile"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setResetting(a)}
                        aria-label="Reset password" title="Reset password"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <FiKey size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(a)}
                        aria-label="Remove admin" title="Remove admin"
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

      {editing && (
        <EditAccountModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setAdmins((prev) => prev.map((a) => (a._id === updated._id ? { ...a, ...updated } : a)));
            setSuccess('Profile updated.');
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => setSuccess(`Password updated for ${resetting.name}.`)}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title="Remove admin"
          message={`Remove ${deleting.name}'s admin account? This cannot be undone.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await api.deleteUser(deleting._id);
            setAdmins((prev) => prev.filter((a) => a._id !== deleting._id));
            setSuccess('Admin account removed.');
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
