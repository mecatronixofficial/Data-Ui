'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiPlusSquare,
  FiBarChart2,
  FiChevronRight,
  FiLogOut,
  FiHome,
  FiShield,
  FiTag,
  FiMenu,
  FiSettings,
  FiUserPlus,
  FiUsers,
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
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);

  const showReportsMenu = role === 'superadmin';

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome, show: true },
    { href: '/dashboard/entry/new', label: name || 'New Entry', icon: FiPlusSquare, show: role === 'admin' || role === 'user' },
    { href: '/dashboard/reports', label: 'Reports', icon: FiBarChart2, show: !showReportsMenu && (permissions?.viewAllReports || role === 'admin' || role === 'superadmin') },
    { href: '/dashboard/fields', label: 'Fields', icon: FiTag, show: permissions?.manageFields || role === 'superadmin' },
  ].filter((link) => link.show);
  const settingsLink = { href: '/dashboard/settings', label: 'Settings', icon: FiSettings };
  const showSettings = role === 'superadmin';

  const createAccountLinks = [
    { href: '/dashboard/admins', label: 'Admin', icon: FiShield },
    { href: '/dashboard/users', label: 'User', icon: FiUsers },
  ];
  const showCreateAccount = role === 'superadmin';
  const createAccountActive = createAccountLinks.some((l) => pathname === l.href);

  const reportsLinks = [
    { href: '/dashboard/reports', label: 'All Reports', icon: FiBarChart2 },
    { href: '/dashboard/reports/admin', label: 'Admin Reports', icon: FiShield },
    { href: '/dashboard/reports/user', label: 'User Reports', icon: FiUsers },
  ];
  const reportsActive = pathname === '/dashboard/reports' || pathname.startsWith('/dashboard/reports/');

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
      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-blue-950 px-4 py-3 text-white lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] ring-1 ring-white/20">
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
          className="fixed inset-0 z-40 bg-blue-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] -translate-x-full flex-col overflow-hidden text-white shadow-[12px_0_48px_rgba(0,20,60,0.35)] transition-transform duration-300 ease-in-out lg:sticky lg:inset-auto lg:top-0 lg:z-0 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(160deg, #072747 0%, #0b3e6c 45%, #064a83 100%)',
        }}
      >
        {/* top-edge 3-D highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {/* ambient glow blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-blue-300/8 blur-3xl" />
        {/* right-edge inner shadow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        {/* ── Logo header ── */}
        <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-5 lg:px-6 lg:py-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            {/* logo with 3-D raised effect */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/30">
              <Image src="/logo/B-one Production (1).png" alt="Beone Production logo" width={40} height={40} className="h-full w-full object-contain" priority />
            </div>
            <div>
              <span className="font-display text-base leading-tight tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                Beone Production
              </span>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-blue-200/50">Workspace</p>
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

        {/* ── Nav label ── */}
        <div className="px-5 pt-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-blue-200/35">Navigation</p>
        </div>

        {/* ── Nav links ── */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
          {showCreateAccount && (
            <div
              className="relative"
              onMouseEnter={() => setCreateMenuOpen(true)}
              onMouseLeave={() => setCreateMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCreateMenuOpen((v) => !v)}
                aria-expanded={createMenuOpen}
                aria-haspopup="true"
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  createAccountActive
                    ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.2)]'
                    : 'text-blue-100/55 hover:bg-white/8 hover:text-blue-50'
                }`}
              >
                {createAccountActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                )}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                  createAccountActive
                    ? 'bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] text-white'
                    : 'text-blue-200/60 group-hover:text-blue-100'
                }`}>
                  <FiUserPlus size={16} aria-hidden="true" />
                </span>
                <span className="flex-1 text-left">Create account</span>
                <FiChevronRight
                  size={14}
                  aria-hidden="true"
                  className={`shrink-0 text-blue-200/50 transition-transform duration-200 ${createMenuOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {createMenuOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                  {createAccountLinks.map((sub) => {
                    const subActive = pathname === sub.href;
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          subActive
                            ? 'bg-white/12 text-white'
                            : 'text-blue-100/50 hover:bg-white/8 hover:text-blue-50'
                        }`}
                      >
                        <SubIcon size={14} aria-hidden="true" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.2)]'
                    : 'text-blue-100/55 hover:bg-white/8 hover:text-blue-50'
                }`}
              >
                {/* active left accent bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                )}
                {/* icon container — raised tile look when active */}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] text-white'
                    : 'text-blue-200/60 group-hover:text-blue-100'
                }`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          {showReportsMenu && (
            <div
              className="relative"
              onMouseEnter={() => setReportsMenuOpen(true)}
              onMouseLeave={() => setReportsMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setReportsMenuOpen((v) => !v)}
                aria-expanded={reportsMenuOpen}
                aria-haspopup="true"
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  reportsActive
                    ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.2)]'
                    : 'text-blue-100/55 hover:bg-white/8 hover:text-blue-50'
                }`}
              >
                {reportsActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                )}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                  reportsActive
                    ? 'bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] text-white'
                    : 'text-blue-200/60 group-hover:text-blue-100'
                }`}>
                  <FiBarChart2 size={16} aria-hidden="true" />
                </span>
                <span className="flex-1 text-left">Reports</span>
                <FiChevronRight
                  size={14}
                  aria-hidden="true"
                  className={`shrink-0 text-blue-200/50 transition-transform duration-200 ${reportsMenuOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {reportsMenuOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                  {reportsLinks.map((sub) => {
                    const subActive = pathname === sub.href;
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          subActive
                            ? 'bg-white/12 text-white'
                            : 'text-blue-100/50 hover:bg-white/8 hover:text-blue-50'
                        }`}
                      >
                        <SubIcon size={14} aria-hidden="true" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showSettings && (() => {
            const active = pathname === settingsLink.href;
            const Icon = settingsLink.icon;
            return (
              <Link
                href={settingsLink.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.2)]'
                    : 'text-blue-100/55 hover:bg-white/8 hover:text-blue-50'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                )}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] text-white'
                    : 'text-blue-200/60 group-hover:text-blue-100'
                }`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>{settingsLink.label}</span>
              </Link>
            );
          })()}
        </nav>

        {/* ── User card ── */}
        <div className="relative border-t border-white/10 p-3 lg:p-4">
          {/* card with 3-D inset look */}
          <div className="overflow-hidden rounded-2xl bg-white/[0.06] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(0,0,0,0.15)] ring-1 ring-white/8">
            <div className="flex items-center gap-3">
              {/* avatar — raised circle */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-600/30 text-sm font-semibold uppercase text-blue-100 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]">
                {name.trim().charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200/45">{role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="mt-2.5 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-blue-100/50 transition hover:bg-red-400/12 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            >
              <FiLogOut size={14} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
