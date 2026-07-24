'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FiArrowRight,
  FiBarChart2,
  FiEdit3,
  FiShield,
  FiTag,
  FiUsers,
} from 'react-icons/fi';
import { api } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  user: 'Member',
};

export default function DashboardHome() {
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.me().then((user) => {
      setRole(user.role || 'user');
      setName(user.name || '');
      setPermissions(user.permissions || {});
    }).catch(() => undefined);
  }, []);

  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS.user;

  const actions = [
    {
      key: 'entry',
      show: role === 'admin' || role === 'user',
      href: '/dashboard/entry/new',
      icon: FiEdit3,
      title: 'Add an entry',
    },
    {
      key: 'reports',
      show: Boolean(permissions.viewAllReports) || role === 'admin' || role === 'superadmin',
      href: '/dashboard/reports',
      icon: FiBarChart2,
      title: 'View reports',
    },
    {
      key: 'fields',
      show: Boolean(permissions.manageFields),
      href: '/dashboard/fields',
      icon: FiTag,
      title: 'Manage fields',
    },
    {
      key: 'users',
      show: Boolean(permissions.manageUsers),
      href: '/dashboard/users',
      icon: FiUsers,
      title: 'Manage users',
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-10">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-8 text-white shadow-[0_32px_80px_rgba(0,107,196,0.35)] sm:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-950/60 to-transparent" />
          <div className="absolute -left-10 -top-10 h-[200%] w-1/2 rotate-12 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
        </div>

        <div className="pointer-events-none absolute right-12 top-8 h-24 w-24 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm rotate-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
        <div className="pointer-events-none absolute right-28 top-20 h-14 w-14 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm -rotate-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm">
            <FiShield size={11} aria-hidden="true" />
            {roleLabel}
          </div>
          <h1 className="font-display text-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] sm:text-5xl">
            Welcome back{name ? `, ${name}` : ''}.
          </h1>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section>
        <div className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Quick actions</p>
          <h2 className="font-display text-2xl text-blue-950">What would you like to do?</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {actions.map(({ key, href, icon: Icon, title }) => (
            <Link
              key={key}
              href={href}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-px shadow-[0_8px_32px_rgba(0,107,196,0.40)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_16px_48px_rgba(0,107,196,0.55)] active:scale-[0.99]"
            >
              {/* inner panel */}
              <div className="relative h-full overflow-hidden rounded-[15px] bg-white p-6">
                {/* top edge highlight */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />

                {/* icon */}
                <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-transform duration-300 group-hover:scale-110">
                  <Icon size={22} className="text-blue-600" aria-hidden="true" />
                </div>

                {/* title + arrow */}
                <div className="relative flex items-center justify-between gap-4">
                  <h3 className="font-display text-xl text-blue-950">{title}</h3>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 transition-transform duration-300 group-hover:translate-x-1">
                    <FiArrowRight size={15} className="text-blue-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {actions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/60 p-8 text-center text-sm text-blue-900/50 sm:col-span-2">
              No actions available for your account yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
