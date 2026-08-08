'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiLock,
  FiShield,
  FiSmartphone,
  FiUser,
} from 'react-icons/fi';
import { api } from '@/lib/api';

type MfaStart = {
  mfaRequired: true;
  setupRequired: boolean;
  challengeToken: string;
  qrCodeDataUrl?: string;
  manualKey?: string;
  issuer?: string;
  accountLabel?: string;
};

type LoginStage = 'credentials' | 'mfa' | 'recovery';

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<LoginStage>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<MfaStart | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response: MfaStart = await api.login(identifier, password);
      setPassword('');
      setCode('');
      setChallenge(response);
      setStage('mfa');
    } catch {
      // The API client shows the error notification.
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setLoading(true);
    try {
      const response = await api.verifyMfa(challenge.challengeToken, code);
      if (Array.isArray(response.recoveryCodes) && response.recoveryCodes.length > 0) {
        setRecoveryCodes(response.recoveryCodes);
        setStage('recovery');
      } else {
        router.push('/dashboard');
      }
    } catch {
      // The API client shows the error notification.
    } finally {
      setLoading(false);
    }
  }

  function returnToCredentials() {
    setStage('credentials');
    setChallenge(null);
    setCode('');
    setRecoveryCodes([]);
  }

  async function copyRecoveryCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-6 sm:py-16"
      style={{ background: 'linear-gradient(160deg, #072747 0%, #0b3e6c 50%, #064a83 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-16 -top-16 h-[180%] w-2/5 rotate-12 bg-gradient-to-br from-white/8 via-white/4 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="pointer-events-none absolute right-[12%] top-[10%] h-28 w-28 rotate-12 rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm" />
      <div className="pointer-events-none absolute bottom-[14%] left-[8%] h-16 w-16 -rotate-6 rounded-xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-sm" />

      <div className={`relative w-full ${stage === 'credentials' ? 'max-w-sm' : 'max-w-md'}`}>
        <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-br from-blue-400/30 via-blue-500/20 to-blue-600/30 blur-xl" />
        <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.98] shadow-[0_32px_80px_rgba(0,20,60,0.45),0_0_0_1px_rgba(255,255,255,0.15)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-50/40 to-transparent" />

          <div className="relative p-6 sm:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <Image src="/logo/B-one Production (1).png" alt="Beone Production logo" width={56} height={56} className="h-full w-full object-contain" priority />
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-900">Beone Production</p>
              <h1 className="font-display text-4xl text-blue-950">
                {stage === 'credentials' ? 'Sign in' : stage === 'mfa' ? 'Verify identity' : 'Recovery codes'}
              </h1>
              {stage === 'mfa' && (
                <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-black">
                  {challenge?.setupRequired
                    ? 'Set up an authenticator once, then enter its current 6-digit code.'
                    : 'Enter the current code from your authenticator app.'}
                </p>
              )}
            </div>

            {stage === 'credentials' && (
              <form onSubmit={handleCredentials} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Email or User ID</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <FiUser size={15} className="shrink-0 text-blue-800" />
                    <input
                      type="text" required value={identifier} maxLength={254} autoComplete="username"
                      autoCapitalize="none" spellCheck={false} onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Email address or user ID"
                      className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Password</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <FiLock size={15} className="shrink-0 text-blue-800" />
                    <input
                      type={showPassword ? 'text' : 'password'} required value={password} maxLength={72}
                      autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                      className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-black"
                    />
                    <button
                      type="button" onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
                      className="shrink-0 rounded-lg p-1 text-blue-700 transition hover:bg-blue-100 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
                    >
                      {showPassword ? <FiEyeOff size={15} aria-hidden="true" /> : <FiEye size={15} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <PrimaryButton loading={loading} loadingText="Checking account..." text="Continue securely" />
              </form>
            )}

            {stage === 'mfa' && challenge && (
              <form onSubmit={handleMfa} className="space-y-5">
                {challenge.setupRequired && challenge.qrCodeDataUrl && (
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-4 text-center">
                    <div className="mb-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-950">
                      <FiSmartphone size={16} /> Google Authenticator setup
                    </div>
                    <Image
                      src={challenge.qrCodeDataUrl}
                      alt="Authenticator enrollment QR code"
                      width={190}
                      height={190}
                      unoptimized
                      className="mx-auto rounded-xl border border-blue-100 bg-white p-2 shadow-sm"
                    />
                    <p className="mt-3 text-xs leading-5 text-black">Scan the QR code. If scanning is unavailable, enter this setup key:</p>
                    <p className="mt-1 select-all break-all rounded-lg bg-white px-3 py-2 font-mono text-xs font-bold tracking-wider text-blue-950 shadow-sm">
                      {challenge.manualKey}
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">
                    {challenge.setupRequired ? '6-digit authenticator code' : 'Authenticator or recovery code'}
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <FiShield size={16} className="shrink-0 text-blue-800" />
                    <input
                      required autoFocus value={code} minLength={6} maxLength={32}
                      inputMode={challenge.setupRequired ? 'numeric' : 'text'} autoComplete="one-time-code"
                      onChange={(e) => setCode(challenge.setupRequired ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
                      placeholder={challenge.setupRequired ? '000000' : '000000 or recovery code'}
                      className="w-full bg-transparent font-mono text-lg font-bold tracking-[0.2em] text-blue-950 outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-black"
                    />
                  </div>
                  {!challenge.setupRequired && (
                    <p className="mt-2 text-xs leading-5 text-black">You can use one unused recovery code if your phone is unavailable.</p>
                  )}
                </div>

                <PrimaryButton loading={loading} loadingText="Verifying..." text={challenge.setupRequired ? 'Finish setup' : 'Verify and sign in'} />
                <button
                  type="button" onClick={returnToCredentials} disabled={loading}
                  className="mx-auto flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50"
                >
                  <FiArrowLeft size={14} /> Back to password
                </button>
              </form>
            )}

            {stage === 'recovery' && (
              <div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-950">Save these one-time codes now</p>
                  <p className="mt-1 text-xs leading-5 text-amber-900">Each code works once if you lose access to your authenticator. They will not be shown again.</p>
                </div>
                <div className="my-5 grid grid-cols-1 gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-2">
                  {recoveryCodes.map((recoveryCode) => (
                    <span key={recoveryCode} className="select-all rounded-lg bg-white px-3 py-2 text-center font-mono text-xs font-bold tracking-wider text-blue-950 shadow-sm">
                      {recoveryCode}
                    </span>
                  ))}
                </div>
                <div className="space-y-3">
                  <button
                    type="button" onClick={copyRecoveryCodes}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                  >
                    {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                    {copied ? 'Copied' : 'Copy recovery codes'}
                  </button>
                  <button
                    type="button" onClick={() => router.push('/dashboard')}
                    className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,107,196,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:-translate-y-0.5"
                  >
                    I saved them - continue
                  </button>
                </div>
              </div>
            )}

            {stage === 'credentials' && (
              <p className="mt-6 text-center text-xs text-black">Password and authenticator verification are required for every account.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PrimaryButton({ loading, loadingText, text }: { loading: boolean; loadingText: string; text: string }) {
  return (
    <button
      type="submit" disabled={loading}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,107,196,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,107,196,0.55)] active:translate-y-0 disabled:opacity-60"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? loadingText : text}
        {!loading && <FiArrowRight size={15} />}
      </span>
    </button>
  );
}
