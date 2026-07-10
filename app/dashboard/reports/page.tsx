'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiDownload, FiFileText, FiFilter, FiSearch, FiTrash2 } from 'react-icons/fi';
import { api, exportUrl } from '@/lib/api';

type Entry = {
  _id: string;
  name: string;
  date: string;
  field1Total: number;
  field2Total: number;
  finalTotal: number;
  createdBy?: { name: string };
};

export default function ReportsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.allEntries({ name, startDate, endDate });
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Could not load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.me()
      .then((user) => {
        if (user.role === 'admin' || user.role === 'superadmin') {
          load();
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm('Remove this entry?')) return;
    try {
      await api.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err: any) {
      setError(err.message || 'Could not remove entry');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Overview</p>
          <h1 className="font-display text-4xl text-emerald-950">Reports</h1>
          <p className="mt-2 text-sm text-ink/55">Review, filter, and export your ledger records.</p>
        </div>
        <a
          href={exportUrl({ name, startDate, endDate })}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <FiDownload size={15} /> Download Excel
        </a>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_14px_40px_rgba(6,78,59,0.08)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FiFilter size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl text-emerald-950">Filter records</h2>
            <p className="text-xs text-ink/45">Narrow the report by name or date range.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Name</label>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/15">
            <FiSearch className="text-emerald-600" size={15} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search by name"
              className="w-full bg-transparent text-sm text-emerald-950 outline-none placeholder:text-emerald-900/35"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 font-mono text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 font-mono text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <button
          onClick={load}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Filter
        </button>
        </div>
      </div>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_14px_40px_rgba(6,78,59,0.08)]">
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FiFileText size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl text-emerald-950">Ledger records</h2>
              <p className="mt-0.5 text-xs text-ink/45">{loading ? 'Loading records' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} found`}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="border-b border-emerald-100 bg-emerald-50/60 text-left text-xs uppercase tracking-wider text-emerald-900/55">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Field 1</th>
              <th className="px-5 py-3 font-medium text-right">Field 2</th>
              <th className="px-5 py-3 font-medium text-right">Final Total</th>
              <th className="px-5 py-3 font-medium">Added by</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink/40 font-mono text-xs">
                  loading…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink/40">
                  No entries match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              entries.map((e) => (
                <tr key={e._id} className="border-b border-emerald-50 transition last:border-0 hover:bg-emerald-50/45">
                  <td className="px-5 py-4 font-medium text-emerald-950">{e.name}</td>
                  <td className="px-5 py-3 font-mono text-ink/60">
                    {new Date(e.date).toISOString().split('T')[0]}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular">{e.field1Total}</td>
                  <td className="px-5 py-3 text-right font-mono tabular">{e.field2Total}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex rounded-lg bg-emerald-100 px-2.5 py-1 font-mono font-semibold tabular text-emerald-800">{e.finalTotal}</span>
                  </td>
                  <td className="px-5 py-3 text-ink/50">{e.createdBy?.name || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(e._id)}
                      className="rounded-lg p-2 text-ink/30 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      aria-label="Delete entry"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
