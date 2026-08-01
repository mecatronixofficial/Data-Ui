'use client';

import { useState } from 'react';
import { FiCheck, FiKey, FiX } from 'react-icons/fi';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: { _id: string; name: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.resetAccountPassword(user._id, password);
      onDone();
      onClose();
    } catch {
      // The API client shows the error notification.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="reset-password-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

        <div className="flex items-start justify-between gap-4 border-b border-blue-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <FiKey size={17} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Super Admin</p>
              <h2 id="reset-password-title" className="font-display text-xl text-blue-950">Reset password</h2>
            </div>
          </div>
          <button onClick={onClose} disabled={saving}
            aria-label="Close" className="rounded-lg p-1.5 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <p className="mb-4 text-sm text-blue-900/60">
            Set a new password for <span className="font-semibold text-blue-950">{user.name}</span>.
          </p>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">New password</label>
          <input
            required type="password" minLength={6} autoFocus
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />

          <div className="mt-6 flex justify-end gap-3 border-t border-blue-100 pt-4">
            <button type="button" onClick={onClose} disabled={saving}
              className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={saving || password.length < 6}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2">
                <FiCheck size={14} />
                {saving ? 'Saving…' : 'Update password'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
