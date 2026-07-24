'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #072747 0%, #0b3e6c 50%, #064a83 100%)' }}>

      {/* ── Background depth layers ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* ambient glows */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        {/* diagonal shine */}
        <div className="absolute -left-16 -top-16 h-[180%] w-2/5 rotate-12 bg-gradient-to-br from-white/8 via-white/4 to-transparent" />
        {/* top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── Floating accent shapes ── */}
      <div className="pointer-events-none absolute right-[12%] top-[10%] h-28 w-28 rounded-2xl border border-white/10 bg-white/5 rotate-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm" />
      <div className="pointer-events-none absolute bottom-[14%] left-[8%] h-16 w-16 rounded-xl border border-white/8 bg-white/4 -rotate-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-sm" />
      <div className="pointer-events-none absolute left-[15%] top-[20%] h-10 w-10 rounded-lg border border-white/8 bg-white/4 rotate-6" />

      {/* ── Card ── */}
      <div className="relative w-full max-w-sm">
        {/* glow rim behind card */}
        <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-br from-blue-400/30 via-blue-500/20 to-blue-600/30 blur-xl" />

        <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.97] shadow-[0_32px_80px_rgba(0,20,60,0.45),0_0_0_1px_rgba(255,255,255,0.15)] backdrop-blur-xl">
          {/* card top-edge highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
          {/* subtle inner top shine */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-50/40 to-transparent" />

          <div className="relative p-8">
            {/* ── Logo / brand ── */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center">
                <Image src="/logo/B-one Production (1).png" alt="Beone Production logo" width={56} height={56} className="h-full w-full object-contain" priority />
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-600">Beone Production</p>
              <h1 className="font-display text-4xl text-blue-950">Sign in</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Email</label>
                <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                  <FiMail size={15} className="shrink-0 text-blue-500" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-900/35"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Password</label>
                <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                  <FiLock size={15} className="shrink-0 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-900/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="shrink-0 rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
                  >
                    {showPassword ? <FiEyeOff size={15} aria-hidden="true" /> : <FiEye size={15} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {/* Submit — 3D raised button */}
              <button
                type="submit" disabled={loading}
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,107,196,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,107,196,0.55)] active:translate-y-0 active:shadow-[0_4px_12px_rgba(0,107,196,0.35)] disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? 'Signing in…' : 'Sign in'}
                  {!loading && <FiArrowRight size={15} />}
                </span>
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-blue-900/40">Access granted by your administrator.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
