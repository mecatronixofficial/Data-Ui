'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

interface DashboardUser {
  name: string;
  role: string;
  permissions: Record<string, boolean>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser({
          name: u?.name || '',
          role: u?.role || 'user',
          permissions: u?.permissions || {},
        });
      })
      .catch(() => {
        if (!cancelled) router.push('/login');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    function handleProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<{ name?: string }>).detail;
      if (!detail?.name) return;
      setUser((current) => current ? { ...current, name: detail.name || current.name } : current);
    }

    window.addEventListener('beone:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('beone:profile-updated', handleProfileUpdated);
  }, []);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f8fc] px-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: 'radial-gradient(#b9deff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white bg-white/95 p-7 text-center shadow-[0_30px_80px_-35px_rgba(7,39,71,0.35)] sm:p-9">
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-blue-50">
            <div className="h-full w-2/5 animate-[workspace-progress_1.4s_ease-in-out_infinite] rounded-full bg-blue-600" />
          </div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-[0_10px_24px_-12px_rgba(0,107,196,0.45)]">
            <Image
              src="/logo/B-one Production (1).png"
              alt="Beone Production"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <h1 className="mt-5 font-display text-xl font-bold text-blue-950">Setting up your projects</h1>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
            Loading your latest activity and workspace insights.
          </p>

          <div className="mx-auto mt-6 flex h-10 w-24 items-end justify-center gap-2 rounded-xl bg-blue-50/70 px-4 py-2 ring-1 ring-blue-100/70" aria-hidden="true">
            <span className="h-2 w-2 animate-[project-bar_1s_ease-in-out_infinite] rounded-full bg-blue-300" />
            <span className="h-4 w-2 animate-[project-bar_1s_ease-in-out_150ms_infinite] rounded-full bg-blue-500" />
            <span className="h-6 w-2 animate-[project-bar_1s_ease-in-out_300ms_infinite] rounded-full bg-blue-700" />
            <span className="h-3 w-2 animate-[project-bar_1s_ease-in-out_450ms_infinite] rounded-full bg-violet-400" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
            Loading workspace
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-blue-50/60 lg:flex-row">
      <Sidebar role={user.role} name={user.name} permissions={user.permissions} />
      <main className="relative min-h-screen min-w-0 flex-1 overflow-x-hidden bg-gradient-to-br from-white via-blue-50/35 to-blue-100/45">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-6xl min-w-0 px-3 py-5 sm:px-8 sm:py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
