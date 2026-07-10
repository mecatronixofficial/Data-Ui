'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-700 px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-[2rem] border border-emerald-200/60 bg-white/95 p-8 shadow-[0_24px_80px_rgba(2,44,34,0.35)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Ledger</p>
            <h1 className="font-display text-4xl text-emerald-950">Sign in</h1>
            <p className="mt-3 text-sm text-emerald-900/60">
              Enter your credentials to continue to your reports and entries.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/70">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20">
                <FiMail className="text-emerald-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm text-emerald-950 outline-none placeholder:text-emerald-900/35"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/70">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20">
                <FiLock className="text-emerald-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-emerald-950 outline-none placeholder:text-emerald-900/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="shrink-0 rounded-md p-1 text-emerald-600 transition hover:bg-emerald-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-rust/20 bg-rust-light px-4 py-3 text-sm text-rust">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-emerald-900/50">
            Access granted by your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
