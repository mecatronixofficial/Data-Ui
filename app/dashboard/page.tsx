'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiBarChart2, FiCheckCircle, FiEdit3, FiPlus } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function DashboardHome() {
  const [role, setRole] = useState('user');

  useEffect(() => {
    api.me().then((user) => setRole(user.role)).catch(() => undefined);
  }, []);

  const canViewReports = role === 'admin' || role === 'superadmin';

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-8 text-white shadow-[0_24px_60px_rgba(0,107,196,0.22)] sm:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-50 backdrop-blur-sm">
            <FiCheckCircle aria-hidden="true" />
            Workspace ready
          </div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Welcome back.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-50/75 sm:text-base">
            Keep your production records accurate and up to date. Add a new record in moments, then review your reports whenever you need them.
          </p>
          <Link
            href="/dashboard/entry/new"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-800 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <FiPlus aria-hidden="true" />
            Create new entry
            <FiArrowRight className="ml-1" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Quick actions</p>
            <h2 className="font-display text-2xl text-blue-950">What would you like to do?</h2>
          </div>
          <p className="hidden text-sm text-blue-900/45 sm:block">Choose an action to continue</p>
        </div>

        <div className={`grid gap-4 ${canViewReports ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
          <Link
            href="/dashboard/entry/new"
            className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_16px_36px_rgba(0,107,196,0.12)]"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
              <FiEdit3 size={20} aria-hidden="true" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-xl text-blue-950">Add an entry</h3>
                <p className="mt-1.5 text-sm leading-6 text-blue-900/55">Record new figures and calculate the final total.</p>
              </div>
              <FiArrowRight className="shrink-0 text-blue-500 transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>

          {canViewReports && (
            <Link
              href="/dashboard/reports"
              className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_16px_36px_rgba(0,107,196,0.12)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                <FiBarChart2 size={20} aria-hidden="true" />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl text-blue-950">View reports</h3>
                  <p className="mt-1.5 text-sm leading-6 text-blue-900/55">Search, review, and export your production records.</p>
                </div>
                <FiArrowRight className="shrink-0 text-blue-500 transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
