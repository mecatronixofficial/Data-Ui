'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiMail,
  FiMessageSquare,
  FiSave,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

type SaveStatus = {
  tone: 'neutral' | 'success' | 'error';
  message: string;
};

type DetailFieldProps = {
  id: string;
  label: string;
  value: string;
  icon: IconType;
  copied: boolean;
  onCopy: () => void;
  onChange?: (value: string) => void;
  type?: 'text' | 'email';
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
  required?: boolean;
  maxLength?: number;
};

export default function UserDetailsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>({
    tone: 'neutral',
    message: 'Your saved account information is shown below.',
  });

  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    api.me()
      .then((user) => {
        if (cancelled) return;
        if (user?.role !== 'user') {
          router.replace('/dashboard');
          return;
        }

        setAllowed(true);
        setUserId(user?.userId || 'Not assigned');
        setName(user?.name || '');
        setEmail(user?.email || '');
        setMessage(user?.message || '');
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) router.replace('/login');
        else router.replace('/dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function copyField(field: string, value: string) {
    if (!value) {
      toast.info('There is no value to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
      }, 1800);
    } catch {
      toast.error('Copy failed. Please select and copy the value manually.');
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLocaleLowerCase();
    if (!cleanName || !cleanEmail) {
      setStatus({ tone: 'error', message: 'Name and email are required.' });
      return;
    }

    setSaving(true);
    setStatus({ tone: 'neutral', message: 'Saving your account details securely...' });

    try {
      const updated = await api.updateProfile({ name: cleanName, email: cleanEmail, message: message.trim() });
      setName(updated?.name || cleanName);
      setEmail(updated?.email || cleanEmail);
      setMessage(updated?.message ?? message.trim());

      window.dispatchEvent(new CustomEvent('beone:profile-updated', {
        detail: { name: updated?.name || cleanName },
      }));
      setStatus({ tone: 'success', message: 'Your account details were saved successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Your changes could not be saved.';
      setStatus({ tone: 'error', message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <DetailsLoading />;
  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#061b30_0%,#073f69_52%,#0873ad_100%)] px-6 py-7 text-white shadow-[0_22px_55px_rgba(4,47,83,0.25)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-blue-300/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/75">My account</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Details</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-blue-100/80">
              Save your contact information, account note, and sign-in changes in one place.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm">
            <FiUser size={24} aria-hidden="true" />
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_15px_42px_rgba(7,59,99,0.09)]">
          <SectionHeading
            icon={FiUser}
            title="Saved information"
            description="Your User ID is fixed. You can update your name, email address, and message."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <DetailField
              id="user-id"
              label="User ID"
              value={userId}
              icon={FiShield}
              readOnly
              copied={copiedField === 'user-id'}
              onCopy={() => copyField('user-id', userId)}
            />
            <DetailField
              id="full-name"
              label="Full name"
              value={name}
              icon={FiUser}
              onChange={setName}
              autoComplete="name"
              placeholder="Enter your full name"
              required
              maxLength={120}
              copied={copiedField === 'full-name'}
              onCopy={() => copyField('full-name', name)}
            />
            <div className="sm:col-span-2">
              <DetailField
                id="email-address"
                label="Email address"
                value={email}
                icon={FiMail}
                type="email"
                onChange={setEmail}
                autoComplete="email"
                placeholder="name@company.com"
                required
                maxLength={254}
                copied={copiedField === 'email-address'}
                onCopy={() => copyField('email-address', email)}
              />
            </div>
            <div className="sm:col-span-2">
              <MessageField
                value={message}
                onChange={setMessage}
                copied={copiedField === 'message'}
                onCopy={() => copyField('message', message)}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_12px_32px_rgba(7,59,99,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <StatusMessage status={status} />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-[0_9px_22px_rgba(0,107,196,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_13px_28px_rgba(0,107,196,0.34)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 disabled:cursor-wait disabled:opacity-65 disabled:hover:translate-y-0"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
            ) : (
              <FiSave size={17} aria-hidden="true" />
            )}
            {saving ? 'Saving details...' : 'Save details'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DetailField({
  id,
  label,
  value,
  icon: Icon,
  copied,
  onCopy,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  readOnly = false,
  required = false,
  maxLength,
}: DetailFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-blue-950">
        {label}
      </label>
      <div className="group relative">
        <Icon
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-blue-100 bg-blue-50/45 pl-11 pr-12 text-[15px] font-semibold text-blue-950 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${readOnly ? 'cursor-text bg-slate-50 text-slate-600' : ''}`}
        />

        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button
            type="button"
            onClick={onCopy}
            disabled={!value}
            aria-label={`Copy ${label.toLocaleLowerCase()}`}
            title={`Copy ${label.toLocaleLowerCase()}`}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-35 ${
              copied ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-blue-100 hover:text-blue-700'
            }`}
          >
            {copied ? <FiCheck size={17} aria-hidden="true" /> : <FiCopy size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageField({
  value,
  onChange,
  copied,
  onCopy,
}: {
  value: string;
  onChange: (value: string) => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <label htmlFor="account-message" className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-blue-950">
        Message
      </label>
      <div className="group relative">
        <FiMessageSquare
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-4 text-blue-500"
        />
        <textarea
          id="account-message"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Write your message or account note here..."
          className="min-h-28 w-full resize-y rounded-xl border border-blue-100 bg-blue-50/45 py-3 pl-11 pr-14 text-[15px] font-semibold leading-6 text-blue-950 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          aria-label="Copy message"
          title="Copy message"
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-35 ${
            copied ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-blue-100 hover:text-blue-700'
          }`}
        >
          {copied ? <FiCheck size={17} aria-hidden="true" /> : <FiCopy size={16} aria-hidden="true" />}
        </button>
        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[10px] font-bold tabular-nums text-slate-400">
          {value.length}/2000
        </span>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: IconType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/55 px-5 py-4 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-[0_6px_14px_rgba(0,107,196,0.25)]">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-display text-xl font-bold text-blue-950">{title}</h2>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: SaveStatus }) {
  const Icon = status.tone === 'success' ? FiCheckCircle : status.tone === 'error' ? FiAlertCircle : FiShield;
  const styles = status.tone === 'success'
    ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
    : status.tone === 'error'
      ? 'bg-red-50 text-red-700 ring-red-100'
      : 'bg-blue-50 text-blue-800 ring-blue-100';

  return (
    <div role="status" aria-live="polite" className={`flex min-h-11 flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold ring-1 ${styles}`}>
      <Icon size={17} className="shrink-0" aria-hidden="true" />
      <span>{status.message}</span>
    </div>
  );
}

function DetailsLoading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(7,59,99,0.1)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" aria-hidden="true" />
        <span className="text-sm font-bold text-blue-950">Loading your details...</span>
      </div>
    </div>
  );
}
