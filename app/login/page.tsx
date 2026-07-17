'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get('oauth_error');
    if (!oauthError) return;

    const messages: Record<string, string> = {
      not_configured: 'Google sign-in is not configured on the server.',
      invalid_state: 'Google sign-in expired or could not be verified. Please try again.',
      access_denied: 'This Google account is not authorized. Ask an administrator for access.',
    };
    setError(messages[oauthError] || 'Google sign-in failed. Please try again.');
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

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

  function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    api.googleLogin();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-[2rem] border border-blue-200/60 bg-white/95 p-8 shadow-[0_24px_80px_rgba(0,67,123,0.35)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#006BC4]">Bone Production</p>
            <h1 className="font-display text-4xl text-blue-950">Sign in</h1>
            <p className="mt-3 text-sm text-blue-900/60">
              Enter your credentials to continue to your reports and entries.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/70">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                <FiMail className="text-[#006BC4]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-900/35"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/70">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                <FiLock className="text-[#006BC4]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-900/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="shrink-0 rounded-md p-1 text-[#006BC4] transition hover:bg-blue-100 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#006BC4] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <div className="mt-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-blue-100" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-900/40">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-blue-100" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-semibold text-blue-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FcGoogle className="text-lg" />
              {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-blue-900/50">
            Access granted by your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
