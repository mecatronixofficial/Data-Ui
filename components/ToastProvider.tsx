'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import { TOAST_EVENT, type ToastInput, type ToastTone } from '@/lib/toast';

type ToastItem = Required<Pick<ToastInput, 'message' | 'tone' | 'duration'>> & {
  id: number;
  title?: string;
};

const TONE_STYLES: Record<ToastTone, { shell: string; accent: string; icon: string; progress: string; title: string }> = {
  success: {
    shell: 'border-emerald-200/80',
    accent: 'bg-emerald-400',
    icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
    progress: 'bg-gradient-to-r from-emerald-400 to-cyan-300',
    title: 'Success',
  },
  error: {
    shell: 'border-rose-200/80',
    accent: 'bg-rose-400',
    icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
    progress: 'bg-gradient-to-r from-rose-400 to-orange-300',
    title: 'Action failed',
  },
  warning: {
    shell: 'border-amber-200/80',
    accent: 'bg-amber-300',
    icon: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    progress: 'bg-gradient-to-r from-amber-300 to-yellow-200',
    title: 'Attention',
  },
  info: {
    shell: 'border-sky-200/80',
    accent: 'bg-sky-300',
    icon: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
    progress: 'bg-gradient-to-r from-sky-300 to-blue-200',
    title: 'Notice',
  },
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <FiCheckCircle size={18} />;
  if (tone === 'error') return <FiAlertCircle size={18} />;
  if (tone === 'warning') return <FiAlertTriangle size={18} />;
  return <FiInfo size={18} />;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const lastToast = useRef({ key: '', time: 0 });

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    const receive = (event: Event) => {
      const input = (event as CustomEvent<ToastInput>).detail;
      if (!input?.message) return;
      const tone = input.tone ?? 'info';
      const duplicateKey = `${tone}:${input.title ?? ''}:${input.message}`;
      const now = Date.now();
      if (lastToast.current.key === duplicateKey && now - lastToast.current.time < 900) return;
      lastToast.current = { key: duplicateKey, time: now };
      const id = nextId.current++;
      const duration = Math.max(1800, input.duration ?? 4200);
      const item: ToastItem = {
        id,
        message: input.message,
        title: input.title,
        tone,
        duration,
      };
      setItems((current) => [...current.slice(-3), item]);
      activeTimers.set(id, setTimeout(() => dismiss(id), duration));
    };

    window.addEventListener(TOAST_EVENT, receive);
    return () => {
      window.removeEventListener(TOAST_EVENT, receive);
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, [dismiss]);

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[20rem]"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => {
          const style = TONE_STYLES[item.tone];
          return (
            <div
              key={item.id}
              role={item.tone === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-lg border bg-white/95 px-3 py-2.5 pr-9 shadow-[0_10px_30px_rgba(7,39,71,0.13),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md animate-toast-in ${style.shell}`}
            >
              <span className={`absolute inset-y-0 left-0 w-0.5 ${style.accent}`} />
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
              <div className="relative flex items-center gap-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.icon}`}>
                  <span className="scale-90"><ToneIcon tone={item.tone} /></span>
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-black">{item.title || style.title}</p>
                  <p className="mt-0.5 break-words text-xs font-medium leading-4 text-blue-950/85">{item.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="absolute right-1.5 top-1.5 rounded-md p-1.5 text-black transition hover:bg-blue-50 hover:text-blue-800"
              >
                <FiX size={15} />
              </button>
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 origin-left animate-toast-progress ${style.progress}`}
                style={{ animationDuration: `${item.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
