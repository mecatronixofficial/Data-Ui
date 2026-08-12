'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiKey, FiSettings, FiShield, FiUser, FiX } from 'react-icons/fi';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaConfirmOpen, setMfaConfirmOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    api.me()
      .then((user) => {
        if (user?.role !== 'superadmin') {
          router.replace('/dashboard');
          return;
        }
        setName(user?.name || '');
        setEmail(user?.email || '');
        setUserId(user?.userId || '');
        setRole(user?.role || '');
        setLoading(false);
        return api.getMfaPolicy();
      })
      .then((policy) => {
        if (policy) setMfaRequired(policy.enabled !== false);
      })
      .catch((error) => {
        if (error?.status === 401) {
          router.replace('/login');
          return;
        }
        toast.error(error?.message || 'Could not load MFA settings');
      })
      .finally(() => setMfaLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.updateProfile({ name: name.trim(), email: email.trim().toLocaleLowerCase() });
    } catch {
      // The API client shows the error notification.
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 12) {
      toast.error('New password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch {
      // The API client shows the error notification.
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleMfaToggle() {
    if (mfaLoading || mfaSaving) return;
    const nextEnabled = !mfaRequired;

    if (!nextEnabled) {
      setMfaCode('');
      setMfaConfirmOpen(true);
      return;
    }

    if (!window.confirm('Turn on MFA? You will sign in again and scan a new QR code.')) return;

    setMfaSaving(true);
    try {
      const policy = await api.updateMfaPolicy(nextEnabled);
      setMfaRequired(policy.enabled !== false);
      if (nextEnabled) {
        await api.logout();
        router.replace('/login');
      }
    } catch {
      // The API client shows the error notification.
    } finally {
      setMfaSaving(false);
    }
  }

  async function handleMfaDisable(e: React.FormEvent) {
    e.preventDefault();
    if (mfaSaving || !/^\d{6}$/.test(mfaCode)) {
      if (!/^\d{6}$/.test(mfaCode)) toast.error('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setMfaSaving(true);
    try {
      const policy = await api.updateMfaPolicy(false, mfaCode);
      setMfaRequired(policy.enabled !== false);
      setMfaCode('');
      setMfaConfirmOpen(false);
    } catch {
      // The API client shows the error notification.
    } finally {
      setMfaSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-black">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        <span className="font-mono text-xs">loading…</span>
      </div>
    );
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
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/60">Account</p>
            <h1 className="font-display text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-4xl">Settings</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <FiSettings size={17} className="text-white" />
            </div>
            <div>
              <p className="font-display text-xl leading-none capitalize text-white">{role}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-200/60">Role</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile form ── */}
      <form onSubmit={handleProfileSave}
        className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiUser size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Profile</h2>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Login User ID</label>
            <input readOnly value={userId} aria-label="Login user ID"
              className="w-full select-all cursor-text rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-xs text-blue-950 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={profileSaving}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2"><FiCheck size={15} /> {profileSaving ? 'Saving…' : 'Save profile'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── Password form ── */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,107,196,0.28)] ${mfaRequired ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 'bg-gradient-to-br from-slate-500 to-slate-400'}`}>
              <FiShield size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl text-blue-950">My multi-factor authentication</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-black">
                {mfaRequired ? 'Authenticator verification is enabled.' : 'Authenticator verification is disabled.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={mfaRequired}
            aria-label="Require multi-factor authentication"
            onClick={handleMfaToggle}
            disabled={mfaLoading || mfaSaving}
            className={`relative h-9 w-16 shrink-0 rounded-full p-1 shadow-inner transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30 disabled:cursor-wait disabled:opacity-60 ${mfaRequired ? 'bg-emerald-600' : 'bg-slate-300'}`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-white text-[9px] font-bold shadow-md transition-transform ${mfaRequired ? 'translate-x-7 text-emerald-700' : 'translate-x-0 text-slate-600'}`}>
              {mfaLoading || mfaSaving ? '...' : mfaRequired ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </section>

      <form onSubmit={handlePasswordSave}
        className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiKey size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Password</h2>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Current password</label>
            <input required type="password" maxLength={72} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">New password</label>
            <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 12 characters"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Confirm new password</label>
            <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
              className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={passwordSaving}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2"><FiKey size={15} /> {passwordSaving ? 'Updating…' : 'Update password'}</span>
            </button>
          </div>
        </div>
      </form>

      {mfaConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-blue-950/55 p-4 backdrop-blur-sm" role="presentation">
          <form
            onSubmit={handleMfaDisable}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-confirm-title"
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_24px_70px_rgba(0,20,55,0.38)]"
          >
            <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/15">
                  <FiShield size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3 id="mfa-confirm-title" className="font-display text-lg font-bold">Verify turn off</h3>
                  <p className="mt-1 text-xs font-medium text-blue-100/80">Security confirmation required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setMfaConfirmOpen(false); setMfaCode(''); }}
                disabled={mfaSaving}
                aria-label="Close verification"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-100 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5">
              <label htmlFor="mfa-disable-code" className="mb-2 block text-xs font-bold uppercase tracking-wider text-blue-950">
                6-digit authenticator code
              </label>
              <input
                id="mfa-disable-code"
                autoFocus
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 text-center font-mono text-xl font-bold tracking-[0.3em] text-blue-950 outline-none transition placeholder:text-blue-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
              />
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                Enter a new code from your authenticator app to turn off MFA.
              </p>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setMfaConfirmOpen(false); setMfaCode(''); }}
                  disabled={mfaSaving}
                  className="rounded-xl border border-blue-100 px-5 py-2.5 text-sm font-bold text-blue-900 transition hover:bg-blue-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mfaSaving || mfaCode.length !== 6}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_7px_18px_rgba(220,38,38,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                >
                  {mfaSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {mfaSaving ? 'Verifying...' : 'Verify and turn off'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
