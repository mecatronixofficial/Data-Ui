'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLoader,
  FiLock,
  FiShield,
  FiSmartphone,
  FiUser,
} from 'react-icons/fi';
import { ApiError, api } from '@/lib/api';

type MfaChallenge = {
  mfaRequired: true;
  setupRequired: boolean;
  challengeToken: string;
  qrCodeDataUrl?: string;
  manualKey?: string;
  issuer?: string;
};

type LoginResponse = MfaChallenge | { mfaRequired: false };
type LoginStage = 'credentials' | 'mfa' | 'recovery';
type MfaView = 'enroll' | 'verify';
type CopyStatus = 'idle' | 'copied' | 'failed';

const LOGO_PATH = '/logo/B-one Production (1).png';

const STAGE_CONTENT: Record<LoginStage, { eyebrow: string; title: string }> = {
  credentials: { eyebrow: 'Welcome back', title: 'Sign in to your workspace' },
  mfa: { eyebrow: 'Two-step verification', title: 'Verify your identity' },
  recovery: { eyebrow: 'Account recovery', title: 'Save your recovery codes' },
};

export default function LoginPage() {
  const router = useRouter();
  const copyTimerRef = useRef<number | null>(null);
  const [stage, setStage] = useState<LoginStage>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [mfaView, setMfaView] = useState<MfaView>('verify');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  function clearError() {
    setErrorMessage('');
  }

  function updateIdentifier(value: string) {
    setIdentifier(value);
    clearError();
  }

  function updatePassword(value: string) {
    setPassword(value);
    clearError();
  }

  function updateVerificationCode(value: string) {
    setCode(value);
    clearError();
  }

  function showRequestError(error: unknown) {
    setErrorMessage(
      error instanceof ApiError
        ? error.message
        : 'Something went wrong. Please try again.',
    );
  }

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      setErrorMessage('Enter your email address or user ID.');
      return;
    }
    if (!password) return;

    setErrorMessage('');
    setLoading(true);
    try {
      const response: LoginResponse = await api.login(normalizedIdentifier, password);
      setPassword('');
      setShowPassword(false);

      if (!response.mfaRequired) {
        router.replace('/dashboard');
        return;
      }

      setChallenge(response);
      setMfaView(response.setupRequired ? 'enroll' : 'verify');
      setCode('');
      setStage('mfa');
    } catch (error) {
      showRequestError(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();
    if (!challenge || normalizedCode.length < 6) return;

    setErrorMessage('');
    setLoading(true);
    try {
      const response = await api.verifyMfa(challenge.challengeToken, normalizedCode);
      const newRecoveryCodes = Array.isArray(response.recoveryCodes)
        ? response.recoveryCodes.filter(
          (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0,
        )
        : [];

      if (newRecoveryCodes.length > 0) {
        setRecoveryCodes(newRecoveryCodes);
        setCopyStatus('idle');
        setStage('recovery');
        return;
      }

      router.replace('/dashboard');
    } catch (error) {
      showRequestError(error);
    } finally {
      setLoading(false);
    }
  }

  function returnToCredentials() {
    if (loading) return;
    setStage('credentials');
    setChallenge(null);
    setMfaView('verify');
    setCode('');
    setRecoveryCodes([]);
    setErrorMessage('');
    setCopyStatus('idle');
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodes.length) return;

    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    setCopyStatus('idle');
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }

    copyTimerRef.current = window.setTimeout(() => {
      setCopyStatus('idle');
      copyTimerRef.current = null;
    }, 3000);
  }

  const content = STAGE_CONTENT[stage];

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#041c33] p-3 font-body font-normal sm:p-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(74,169,244,0.55),transparent_38%),radial-gradient(circle_at_8%_90%,rgba(0,107,196,0.3),transparent_30%),linear-gradient(145deg,#03172a_0%,#07365e_52%,#075387_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <div
        className={`relative w-full transition-[max-width] duration-300 ${stage === 'credentials' ? 'max-w-[27rem]' : 'max-w-[30rem]'
          }`}
      >
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-blue-300/30 via-white/5 to-cyan-300/20 blur-xl" aria-hidden="true" />
        <section className="scrollbar-hide relative max-h-[calc(100dvh-1.5rem)] overflow-x-hidden overflow-y-auto rounded-[1.75rem] border border-white/70 bg-white/[0.98] shadow-[0_30px_80px_-22px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:max-h-[calc(100dvh-3rem)]">
          <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-blue-400" />
          <div className={`p-5 sm:p-7 ${stage === 'mfa' && challenge?.setupRequired ? 'sm:p-6' : ''}`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
                  <Image
                    src={LOGO_PATH}
                    alt="Beone Production logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-tight text-blue-950">Beone Production</p>
                  <p className="mt-0.5 text-xs font-normal text-slate-500">
                    Operations workspace
                  </p>
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" title="Secure sign in">
                <FiShield size={17} aria-hidden="true" />
                <span className="sr-only">Secure sign in</span>
              </div>
            </div>

            <header className="mb-5">
              <p className="mb-1.5 text-xs font-medium text-blue-600">
                {content.eyebrow}
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-blue-950 sm:text-[1.7rem]">
                {content.title}
              </h1>
              {stage !== 'credentials' && (
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  {stage === 'mfa' &&
                    (challenge?.setupRequired
                      ? mfaView === 'enroll'
                        ? 'Scan the QR code with your authenticator app, then continue.'
                        : 'Enter the 6-digit code shown in your authenticator app.'
                      : 'Enter your authenticator code or an unused recovery code.')}
                  {stage === 'recovery' && 'Keep these one-time codes somewhere safe.'}
                </p>
              )}
            </header>

            {errorMessage && (
              <div
                role="alert"
                className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-5 text-red-800"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                {errorMessage}
              </div>
            )}

            {stage === 'credentials' && (
              <CredentialsForm
                identifier={identifier}
                password={password}
                showPassword={showPassword}
                loading={loading}
                onIdentifierChange={updateIdentifier}
                onPasswordChange={updatePassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                onSubmit={handleCredentials}
              />
            )}

            {stage === 'mfa' && challenge && (
              <MfaForm
                challenge={challenge}
                view={mfaView}
                code={code}
                loading={loading}
                onCodeChange={updateVerificationCode}
                onBack={returnToCredentials}
                onContinueFromQr={() => {
                  setCode('');
                  setErrorMessage('');
                  setMfaView('verify');
                }}
                onReturnToQr={() => {
                  setCode('');
                  setErrorMessage('');
                  setMfaView('enroll');
                }}
                onSubmit={handleMfa}
              />
            )}

            {stage === 'recovery' && (
              <RecoveryCodes
                recoveryCodes={recoveryCodes}
                copyStatus={copyStatus}
                onCopy={copyRecoveryCodes}
                onContinue={() => router.replace('/dashboard')}
              />
            )}

            {stage === 'credentials' && (
              <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <FiLock size={12} aria-hidden="true" />
                Your sign-in is private and protected
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type CredentialsFormProps = {
  identifier: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CredentialsForm({
  identifier,
  password,
  showPassword,
  loading,
  onIdentifierChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: CredentialsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-busy={loading}>
      <Field label="Email or user ID" htmlFor="identifier" labelSize="large">
        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700" size={19} aria-hidden="true" />
        <input
          id="identifier"
          type="text"
          required
          value={identifier}
          maxLength={254}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={loading}
          onChange={(event) => onIdentifierChange(event.target.value)}
          placeholder="name@company.com"
          className="peer h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-4 text-base text-blue-950 outline-none transition placeholder:text-base placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </Field>

      <Field label="Password" htmlFor="password" labelSize="large">
        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700" size={19} aria-hidden="true" />
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          required
          value={password}
          maxLength={72}
          autoComplete="current-password"
          disabled={loading}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Enter your password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-12 text-base text-blue-950 outline-none transition placeholder:text-base placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          disabled={loading}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
        >
          {showPassword ? <FiEyeOff size={18} aria-hidden="true" /> : <FiEye size={18} aria-hidden="true" />}
        </button>
      </Field>

      <PrimaryButton loading={loading} loadingText="Signing you in...">
        Continue securely
      </PrimaryButton>
    </form>
  );
}

type MfaFormProps = {
  challenge: MfaChallenge;
  view: MfaView;
  code: string;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onBack: () => void;
  onContinueFromQr: () => void;
  onReturnToQr: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function MfaForm({
  challenge,
  view,
  code,
  loading,
  onCodeChange,
  onBack,
  onContinueFromQr,
  onReturnToQr,
  onSubmit,
}: MfaFormProps) {
  const isSetup = challenge.setupRequired;
  const issuerLabel = challenge.issuer || 'Beone Production';

  if (isSetup && view === 'enroll') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
          <div className="mb-3 flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <FiSmartphone size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-blue-950">Set up your authenticator</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                Scan with Google Authenticator, Microsoft Authenticator, or a compatible app.
              </p>
            </div>
          </div>

          {challenge.qrCodeDataUrl ? (
            <div className="mx-auto w-fit rounded-xl border border-blue-100 bg-white p-2 shadow-sm">
              <Image
                src={challenge.qrCodeDataUrl}
                alt={`QR code for ${issuerLabel} authenticator setup`}
                width={144}
                height={144}
                unoptimized
                className="h-32 w-32 sm:h-36 sm:w-36"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              QR code unavailable. Add the setup key below to your authenticator app manually.
            </div>
          )}

          {challenge.manualKey && (
            <div className="mt-2.5">
              <p className="mb-1 text-center text-xs font-normal text-slate-500">
                Manual setup key
              </p>
              <code className="block select-all break-all rounded-lg border border-blue-100 bg-white px-3 py-2 text-center font-mono text-xs font-medium tracking-wide text-blue-950">
                {challenge.manualKey}
              </code>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onContinueFromQr}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_-12px_rgba(0,87,162,0.75)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-0 motion-reduce:transform-none"
        >
          I&apos;ve scanned the QR code
          <FiArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onBack}
          className="mx-auto flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-normal text-slate-600 transition hover:bg-slate-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <FiArrowLeft size={15} aria-hidden="true" />
          Back to password
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-busy={loading}>
      <Field
        label={isSetup ? '6-digit authenticator code' : 'Authenticator or recovery code'}
        htmlFor="verification-code"
        hint={!isSetup ? 'A recovery code can be used if your phone is unavailable.' : undefined}
      >
        <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700" size={18} aria-hidden="true" />
        <input
          id="verification-code"
          required
          autoFocus
          value={code}
          minLength={6}
          maxLength={32}
          pattern={isSetup ? '[0-9]{6}' : undefined}
          inputMode={isSetup ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          disabled={loading}
          onChange={(event) =>
            onCodeChange(isSetup ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)
          }
          placeholder={isSetup ? '000000' : 'Enter code'}
          aria-describedby={!isSetup ? 'verification-code-hint' : undefined}
          className={`h-[3.25rem] w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-4 font-mono font-medium text-blue-950 outline-none transition placeholder:font-body placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 ${isSetup ? 'text-lg tracking-[0.2em]' : 'text-sm tracking-wide'}`}
        />
      </Field>

      <PrimaryButton loading={loading} loadingText="Verifying code..." disabled={isSetup && code.length !== 6}>
        {isSetup ? 'Verify and finish setup' : 'Verify and sign in'}
      </PrimaryButton>

      <div className="flex items-center justify-center gap-2">
        {isSetup && (
          <button
            type="button"
            onClick={onReturnToQr}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-normal text-slate-600 transition hover:bg-slate-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiArrowLeft size={14} aria-hidden="true" />
            Back to QR code
          </button>
        )}
        {!isSetup && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-normal text-slate-600 transition hover:bg-slate-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiArrowLeft size={14} aria-hidden="true" />
            Back to password
          </button>
        )}
      </div>
    </form>
  );
}

type RecoveryCodesProps = {
  recoveryCodes: string[];
  copyStatus: CopyStatus;
  onCopy: () => void;
  onContinue: () => void;
};

function RecoveryCodes({ recoveryCodes, copyStatus, onCopy, onContinue }: RecoveryCodesProps) {
  return (
    <div>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
        <FiShield className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-amber-950">These codes are shown only once</p>
          <p className="mt-0.5 text-xs leading-5 text-amber-900">
            Each code can be used one time if you lose access to your authenticator.
          </p>
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
        {recoveryCodes.map((recoveryCode, index) => (
          <code
            key={`${recoveryCode}-${index}`}
            className="select-all rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-center font-mono text-xs font-medium tracking-wide text-blue-950 shadow-sm"
          >
            {recoveryCode}
          </code>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {copyStatus === 'copied' && 'Recovery codes copied to clipboard.'}
        {copyStatus === 'failed' && 'Recovery codes could not be copied. Select and copy them manually.'}
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onCopy}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${copyStatus === 'copied'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : copyStatus === 'failed'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'
            }`}
        >
          {copyStatus === 'copied' ? <FiCheckCircle size={17} /> : <FiCopy size={17} />}
          {copyStatus === 'copied'
            ? 'Copied to clipboard'
            : copyStatus === 'failed'
              ? 'Select and copy manually'
              : 'Copy recovery codes'}
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_-12px_rgba(0,87,162,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(0,87,162,0.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-0 motion-reduce:transform-none"
        >
          I saved my codes
          <FiArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  labelSize = 'default',
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  labelSize?: 'default' | 'large';
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className={`mb-1.5 block font-medium text-blue-950 ${labelSize === 'large' ? 'text-sm' : 'text-xs'}`}
      >
        {label}
      </label>
      <div className="relative">{children}</div>
      {hint && (
        <p id={`${htmlFor}-hint`} className="mt-2 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({
  loading,
  loadingText,
  disabled = false,
  children,
}: {
  loading: boolean;
  loadingText: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_-12px_rgba(0,87,162,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(0,87,162,0.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 motion-reduce:transform-none"
    >
      {loading ? (
        <>
          <FiLoader className="animate-spin" size={17} aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <FiArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />
        </>
      )}
    </button>
  );
}
