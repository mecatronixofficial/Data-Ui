'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiPlusSquare,
  FiBarChart2,
  FiUsers,
  FiLogOut,
  FiHome,
  FiTag,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { api } from '@/lib/api';

export default function Sidebar({
  role,
  name,
  permissions,
}: {
  role: string;
  name: string;
  permissions: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome, show: true },
    { href: '/dashboard/entry/new', label: 'New Entry', icon: FiPlusSquare, show: role === 'admin' || role === 'user' },
    { href: '/dashboard/reports', label: 'Reports', icon: FiBarChart2, show: permissions?.viewAllReports },
    { href: '/dashboard/fields', label: 'Fields', icon: FiTag, show: permissions?.manageFields },
    { href: '/dashboard/users', label: 'Users', icon: FiUsers, show: permissions?.manageUsers },
  ].filter((link) => link.show);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setOpen(false);
    await api.logout();
    router.push('/login');
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-blue-950 px-4 py-3 text-white lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-white/20">
            <Image src="/logo/B-one Production (1).png" alt="Beone Production logo" width={32} height={32} className="h-full w-full object-contain" priority />
          </div>
          <span className="font-display text-base tracking-wide text-white">Beone Production</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-50 transition hover:bg-white/10"
        >
          <FiMenu size={20} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] -translate-x-full flex-col overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-900 text-white shadow-[12px_0_40px_rgba(0,107,196,0.12)] transition-transform duration-300 ease-in-out lg:sticky lg:inset-auto lg:top-0 lg:z-0 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-6 lg:px-6 lg:py-7">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/20">
              <Image src="/logo/B-one Production (1).png" alt="Beone Production logo" width={40} height={40} className="h-full w-full object-contain" priority />
            </div>
            <div>
              <span className="font-display text-lg leading-tight tracking-wide text-white">Beone Production</span>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-blue-200/55">Workspace</p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-50 transition hover:bg-white/10 lg:hidden"
          >
            <FiX size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/40">Menu</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5 lg:py-4">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'bg-white text-blue-900 shadow-lg shadow-blue-950/20'
                    : 'text-blue-50/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                {active && <span className="absolute -left-3 h-7 w-1 rounded-r-full bg-blue-300" />}
                <Icon className="shrink-0" size={18} aria-hidden="true" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 lg:p-4">
          <div className="rounded-2xl bg-white/[0.07] p-2 ring-1 ring-white/10 lg:p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-sm font-semibold uppercase text-blue-100">
                {name.trim().charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200/50">{role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-blue-100/60 transition hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            >
              <FiLogOut size={15} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
