'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiPlusSquare,
  FiBarChart2,
  FiUsers,
  FiLogOut,
  FiBookOpen,
  FiHome,
} from 'react-icons/fi';
import { api } from '@/lib/api';

export default function Sidebar({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['user', 'admin', 'superadmin'] },
    { href: '/dashboard/entry/new', label: 'New Entry', icon: FiPlusSquare, roles: ['user', 'admin', 'superadmin'] },
    { href: '/dashboard/reports', label: 'Reports', icon: FiBarChart2, roles: ['admin', 'superadmin'] },
    { href: '/dashboard/users', label: 'Users', icon: FiUsers, roles: ['admin', 'superadmin'] },
  ].filter((link) => link.roles.includes(role));

  async function handleLogout() {
    await api.logout();
    router.push('/login');
  }

  return (
    <aside className="sticky top-0 flex min-h-screen w-20 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-900 text-white shadow-[12px_0_40px_rgba(6,78,59,0.12)] lg:w-64">
      <div className="border-b border-white/10 px-4 py-6 lg:px-6 lg:py-7">
        <Link href="/dashboard" className="flex items-center justify-center gap-3 lg:justify-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-200 ring-1 ring-white/10">
            <FiBookOpen size={20} aria-hidden="true" />
          </div>
          <div className="hidden lg:block">
            <span className="font-display text-lg leading-tight tracking-wide text-white">Veone Production</span>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-emerald-200/55">Workspace</p>
          </div>
        </Link>
      </div>

      <div className="hidden px-6 pt-6 lg:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/40">Menu</p>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5 lg:py-4">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all lg:justify-start ${
                active
                  ? 'bg-white text-emerald-900 shadow-lg shadow-emerald-950/20'
                  : 'text-emerald-50/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              {active && <span className="absolute -left-3 h-7 w-1 rounded-r-full bg-emerald-300" />}
              <Icon className="shrink-0" size={18} aria-hidden="true" />
              <span className="hidden lg:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 lg:p-4">
        <div className="rounded-2xl bg-white/[0.07] p-2 ring-1 ring-white/10 lg:p-3">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-sm font-semibold uppercase text-emerald-100">
              {name.trim().charAt(0) || 'U'}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-200/50">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-emerald-100/60 transition hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 lg:justify-start"
          >
            <FiLogOut size={15} aria-hidden="true" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
