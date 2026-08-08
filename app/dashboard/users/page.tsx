'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiKey, FiPower, FiShieldOff, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import EditAccountModal from '@/components/EditAccountModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

type AccountRow = { _id: string; userId?: string; name: string; email: string; role: string; teamName?: string; assignedAdminId?: string | null; isActive?: boolean; mfaEnabled?: boolean };

function nextAvailableUserId(prefix: string, accounts: AccountRow[]) {
  const used = new Set(accounts.map((account) => account.userId?.toLocaleLowerCase()).filter(Boolean));
  let sequence = 1;
  while (used.has(`${prefix}${String(sequence).padStart(2, '0')}`.toLocaleLowerCase())) sequence += 1;
  return `${prefix}${String(sequence).padStart(2, '0')}`;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AccountRow[]>([]);
  const [admins, setAdmins] = useState<AccountRow[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [assignedAdminId, setAssignedAdminId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [resetting, setResetting] = useState<AccountRow | null>(null);
  const [resettingMfa, setResettingMfa] = useState<AccountRow | null>(null);
  const [deleting, setDeleting] = useState<AccountRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const all: AccountRow[] = await api.listUsers();
      setUsers(all.filter((u) => u.role === 'user'));
      setAdmins(all.filter((u) => u.role === 'admin'));
      setUserId((current) => current || nextAvailableUserId('User', all));
    } catch (err: any) {
      toast.error(err.message || 'Could not load users');
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

  const adminById = new Map(admins.map((a) => [a._id, a]));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLocaleLowerCase();
    const normalizedUserId = userId.trim();
    if (users.some((u) => u.email.trim().toLocaleLowerCase() === normalizedEmail)) {
      toast.error(`An account with the email "${normalizedEmail}" already exists.`);
      return;
    }
    if ([...users, ...admins].some((account) => account.userId?.toLocaleLowerCase() === normalizedUserId.toLocaleLowerCase())) {
      toast.error(`The User ID "${normalizedUserId}" already exists.`);
      return;
    }
    if (!assignedAdminId) {
      toast.error('Select an admin for this user.');
      return;
    }
    setCreating(true);
    try {
      await api.createUser({ name: name.trim(), userId: normalizedUserId, email: normalizedEmail, password, role: 'user', assignedAdminId });
      setName(''); setUserId(''); setEmail(''); setPassword(''); setAssignedAdminId('');
      load();
    } catch {
      // The API client shows the error notification.
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(user: AccountRow) {
    const nextActive = user.isActive === false;
    setTogglingId(user._id);
    try {
      await api.setAccountStatus(user._id, nextActive);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: nextActive } : u)));
    } catch {
      // The API client shows the error notification.
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

      {/* ── Create user form ── */}
      <form onSubmit={handleCreate}
        className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUserPlus size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Create a user</h2>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Login User ID</label>
            <input required value={userId} minLength={3} maxLength={32} pattern="[A-Za-z][A-Za-z0-9._-]{2,31}"
              autoCapitalize="none" spellCheck={false} onChange={(e) => setUserId(e.target.value)} placeholder="User01"
              title="Start with a letter; use 3-32 letters, numbers, dots, underscores, or hyphens"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Password</label>
            <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 12 characters"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Select admin</label>
            <select required value={assignedAdminId} onChange={(e) => setAssignedAdminId(e.target.value)}
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15">
              <option value="" disabled>Choose an admin</option>
              {admins.map((a) => (
                <option key={a._id} value={a._id}>{a.teamName || 'Legacy team'} — {a.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            {!loading && admins.length === 0 && (
              <p className="mb-3 text-xs text-black">No admin accounts yet — create one on the Admins page first.</p>
            )}
            <button type="submit" disabled={creating || admins.length === 0}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2"><FiUserPlus size={15} /> {creating ? 'Creating…' : 'Create user'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── Users table ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUsers size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">All users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-black">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Team</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-black">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                    <span className="font-mono text-xs">loading…</span>
                  </div>
                </td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-black">No users yet.</td></tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u._id} className="border-b border-blue-50 transition last:border-0 hover:bg-blue-50/40">
                  <td className="px-5 py-4 font-medium text-blue-950">{u.name}</td>
                  <td className="px-5 py-3 text-black">
                    <span className="block">{u.email}</span>
                    <span className="mt-0.5 block select-all font-mono text-[10px] text-blue-700" title="Login user ID">
                      User ID: {u.userId || 'Pending assignment'}
                    </span>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${u.mfaEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {u.mfaEnabled ? 'MFA active' : 'MFA setup pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-black">
                    {u.assignedAdminId
                      ? (adminById.get(u.assignedAdminId)?.teamName || adminById.get(u.assignedAdminId)?.name || '—')
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={togglingId === u._id}
                        aria-label={u.isActive === false ? 'Activate account' : 'Deactivate account'}
                        title={u.isActive === false ? 'Activate account' : 'Deactivate account'}
                        className={`flex items-center gap-1.5 rounded-lg p-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                          u.isActive === false
                            ? 'text-red-600 hover:bg-red-50 focus-visible:ring-red-300'
                            : 'text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-300'
                        }`}
                      >
                        <FiPower size={14} />
                      </button>
                      <button
                        onClick={() => setEditing(u)}
                        aria-label="Edit profile" title="Edit profile"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setResetting(u)}
                        aria-label="Reset password" title="Reset password"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <FiKey size={14} />
                      </button>
                      <button
                        onClick={() => setResettingMfa(u)}
                        disabled={!u.mfaEnabled}
                        aria-label="Reset authenticator" title={u.mfaEnabled ? 'Reset authenticator' : 'Authenticator is not enrolled'}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <FiShieldOff size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(u)}
                        aria-label="Remove user" title="Remove user"
                        className="rounded-lg p-2 text-black transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
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
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => undefined}
        />
      )}

      {resettingMfa && (
        <ConfirmDeleteModal
          variant="reset-mfa"
          title="Reset authenticator"
          message={`Reset ${resettingMfa.name}'s authenticator and recovery codes? They must scan a new QR code at their next sign-in.`}
          onClose={() => setResettingMfa(null)}
          onConfirm={async () => {
            await api.resetAccountMfa(resettingMfa._id);
            setUsers((prev) => prev.map((user) => user._id === resettingMfa._id ? { ...user, mfaEnabled: false } : user));
            setResettingMfa(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title="Remove user"
          message={`Remove ${deleting.name}'s account? This cannot be undone.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await api.deleteUser(deleting._id);
            setUsers((prev) => prev.filter((u) => u._id !== deleting._id));
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
