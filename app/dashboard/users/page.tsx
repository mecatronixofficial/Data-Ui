'use client';

import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

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
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const normalizedEmail = email.trim().toLocaleLowerCase();

    const emailExists = users.some(
      (user) => user.email.trim().toLocaleLowerCase() === normalizedEmail,
    );
    if (emailExists) {
      setError(`An account with the email "${normalizedEmail}" already exists.`);
      return;
    }

    try {
      await api.createUser({ name: name.trim(), email: normalizedEmail, password, role });
      setSuccess(`${role === 'admin' ? 'Admin' : 'User'} account created.`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Access control</p>
          <h1 className="font-display text-4xl text-emerald-950">Users</h1>
          <p className="mt-2 text-sm text-ink/55">Create accounts and manage access to the Veone Production workspace.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FiUsers size={19} aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-xl leading-none text-emerald-950">{users.length}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Total users</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 items-end gap-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_14px_40px_rgba(6,78,59,0.08)] sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/15">
              <FiUserPlus size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl text-emerald-950">Create an account</h2>
              <p className="text-xs text-ink/45">Enter the new user's details below.</p>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <FiUserPlus size={15} /> Create account
          </button>
        </div>
      </form>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}
      {success && <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><FiCheckCircle />{success}</p>}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_14px_40px_rgba(6,78,59,0.08)]">
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-emerald-950">Team accounts</h2>
            <p className="mt-0.5 text-xs text-ink/45">People with access to this workspace</p>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-emerald-100 bg-emerald-50/60 text-left text-xs uppercase tracking-wider text-emerald-900/55">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-ink/40 font-mono text-xs">
                  loading…
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u._id} className="border-b border-emerald-50 transition last:border-0 hover:bg-emerald-50/45">
                  <td className="px-5 py-4 font-medium text-emerald-950">{u.name}</td>
                  <td className="px-5 py-3 text-ink/60">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="rounded-lg p-2 text-ink/30 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      aria-label="Remove user"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
