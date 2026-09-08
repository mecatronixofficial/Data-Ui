'use client';

import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <FiAlertCircle size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl text-blue-950">This page could not load</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your session is safe. Try loading this section again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <FiRefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      </section>
    </div>
  );
}
