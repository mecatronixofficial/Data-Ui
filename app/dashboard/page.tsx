'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBarChart2,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit3,
  FiHome,
  FiPieChart,
  FiRepeat,
  FiShield,
  FiTag,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { api } from '@/lib/api';
import StatCard, { type StatCardTone } from '@/components/StatCard';

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

  const money = (n: number) => `$${Math.abs(n).toLocaleString()}`.replace('$', n < 0 ? '-$' : '$');

  const stats: { label: string; value: string; icon: typeof FiTrendingUp; tone?: StatCardTone; highlight?: boolean }[] = [
    { label: 'Total In', value: money(14647393), icon: FiTrendingUp, tone: 'positive' },
    { label: 'Total Out', value: money(7477170), icon: FiTrendingDown, tone: 'negative' },
    { label: 'USDT Deposit', value: money(9800), icon: FiRepeat, tone: 'positive' },
    { label: 'USDT Withdrawal', value: money(0), icon: FiRepeat },
    { label: 'Bank Balance', value: money(1487086), icon: FiCreditCard },
    { label: 'Expenses', value: money(510000), icon: FiDollarSign },
    { label: 'Total In / Out', value: money(7170223), icon: FiTrendingUp, tone: 'positive' },
    { label: 'USDT Balance', value: money(9800), icon: FiRepeat, tone: 'positive' },
    { label: 'Account Opening', value: money(665764), icon: FiHome },
    { label: 'Inactive Bank Account', value: money(1519072), icon: FiCreditCard },
    { label: 'Pending to Clear', value: money(355607), icon: FiClock },
    { label: 'P Balance', value: money(11260650), icon: FiBarChart2 },
    { label: 'Profit / Loss', value: money(50040), icon: FiTrendingUp, tone: 'positive' },
    { label: 'Total 1', value: money(11006338), icon: FiPieChart },
    { label: 'Total 2', value: money(11310690), icon: FiPieChart },
    { label: 'Shortage', value: money(-304352), icon: FiAlertTriangle, highlight: true },
  ];

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
      show: Boolean(permissions.viewAllReports),
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-8 text-white shadow-[0_24px_60px_rgba(0,107,196,0.22)] sm:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50 backdrop-blur-sm">
            <FiShield aria-hidden="true" />
            {roleLabel}
          </div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Welcome back{name ? `, ${name}` : ''}.
          </h1>
        </div>
      </section>

      {/* <section>
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Overview</p>
          <h2 className="font-display text-2xl text-blue-950">Branch overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section> */}

      <section>
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Quick actions</p>
          <h2 className="font-display text-2xl text-blue-950">What would you like to do?</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map(({ key, href, icon: Icon, title }) => (
            <Link
              key={key}
              href={href}
              className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_16px_36px_rgba(0,107,196,0.12)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={20} aria-hidden="true" />
              </div>
              <div className="flex items-end justify-between gap-4">
                <h3 className="font-display text-xl text-blue-950">{title}</h3>
                <FiArrowRight className="shrink-0 text-blue-500 transition group-hover:translate-x-1" aria-hidden="true" />
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
