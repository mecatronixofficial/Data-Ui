'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-center rounded-2xl border border-white/15 bg-white/10 px-10 py-8 shadow-2xl backdrop-blur-md">
          <div className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-50/80">Loading workspace</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-emerald-50/60">
      <Sidebar role={user.role} name={user.name} />
      <main className="relative min-h-screen min-w-0 flex-1 overflow-hidden bg-gradient-to-br from-white via-emerald-50/35 to-green-100/45">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-green-200/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
