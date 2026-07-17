'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiDownload, FiEdit2, FiFileText, FiFilter, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { api, exportUrl } from '@/lib/api';

type Entry = {
  _id: string;
  name: string;
  date: string;
  field1Total: number;
  field2Total: number;
  finalTotal: number;
  field1Boxes: number[];
  field1BoxNames: string[];
  operator1: string;
  field2Boxes: number[];
  field2BoxNames: string[];
  operator2: string;
  operator3: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string };
};

function wasEdited(entry: Entry) {
  if (!entry.createdAt || !entry.updatedAt) return false;
  return new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000;
}

export default function ReportsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [canManageReports, setCanManageReports] = useState(false);

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
          setCanManageReports(user.role === 'superadmin');
          load();
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteEntry(deleteTarget._id);
      setEntries((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message || 'Could not remove entry');
    } finally {
      setDeleting(false);
    }
  }

  function updateEditing(field: keyof Entry, value: Entry[keyof Entry]) {
    setEditing((current) => current ? { ...current, [field]: value } : current);
  }

  function updateBox(field: 'field1Boxes' | 'field2Boxes', index: number, value: number) {
    if (!editing) return;
    const boxes = [...editing[field]];
    boxes[index] = value;
    updateEditing(field, boxes);
  }

  function updateBoxName(field: 'field1BoxNames' | 'field2BoxNames', index: number, value: string) {
    if (!editing) return;
    const names = [...editing[field]];
    names[index] = value;
    updateEditing(field, names);
  }

  async function handleUpdate() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError('Please enter a name before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateEntry(editing._id, {
        name: editing.name.trim(),
        date: new Date(editing.date).toISOString().split('T')[0],
        field1Boxes: editing.field1Boxes,
        field1BoxNames: editing.field1BoxNames,
        operator1: editing.operator1,
        field2Boxes: editing.field2Boxes,
        field2BoxNames: editing.field2BoxNames,
        operator2: '+',
        operator3: editing.operator3,
      });
      setEntries((current) => current.map((entry) => entry._id === editing._id ? { ...entry, ...updated } : entry));
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Could not update entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Overview</p>
          <h1 className="font-display text-4xl text-blue-950">Reports</h1>
          <p className="mt-2 text-sm text-blue-900/55">Review, filter, and export your production records.</p>
        </div>
        <a
          href={exportUrl({ name, startDate, endDate })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <FiDownload size={15} /> Download Excel
        </a>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <FiFilter size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl text-blue-950">Filter records</h2>
            <p className="text-xs text-blue-900/45">Narrow the report by name or date range.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Name</label>
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15">
            <FiSearch className="text-blue-600" size={15} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search by name"
              className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-900/35"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
        <button
          onClick={load}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Filter
        </button>
        </div>
      </div>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}

      {editing && (
        <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.10)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Admin action</p>
              <h2 className="font-display text-2xl text-blue-950">Edit record</h2>
            </div>
            <button onClick={() => setEditing(null)} aria-label="Close editor" className="rounded-lg p-2 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700"><FiX /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/65">Name
              <input value={editing.name} onChange={(event) => updateEditing('name', event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-blue-400" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/65">Date
              <input type="date" value={new Date(editing.date).toISOString().split('T')[0]} onChange={(event) => updateEditing('date', event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-blue-400" />
            </label>
          </div>
          <EditBoxes title="Field 1" values={editing.field1Boxes} names={editing.field1BoxNames} onChange={(index, value) => updateBox('field1Boxes', index, value)} onNameChange={(index, value) => updateBoxName('field1BoxNames', index, value)} />
          <label className="mt-4 block max-w-xs text-xs font-semibold uppercase tracking-wider text-blue-900/65">Field 1 operator
            <select value={editing.operator1} onChange={(event) => updateEditing('operator1', event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm outline-none"><option>+</option><option>-</option><option>*</option><option>/</option></select>
          </label>
          <EditBoxes title="Field 2" values={editing.field2Boxes} names={editing.field2BoxNames} onChange={(index, value) => updateBox('field2Boxes', index, value)} onNameChange={(index, value) => updateBoxName('field2BoxNames', index, value)} />
          <label className="mt-4 block max-w-xs text-xs font-semibold uppercase tracking-wider text-blue-900/65">Final operator
            <select value={editing.operator3} onChange={(event) => updateEditing('operator3', event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm outline-none"><option>+</option><option>-</option><option>*</option><option>/</option></select>
          </label>
          <div className="mt-6 flex gap-3">
            <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><FiCheck />{saving ? 'Saving...' : 'Save changes'}</button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-blue-200 px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50">Cancel</button>
          </div>
        </section>
      )}

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FiFileText size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl text-blue-950">Production records</h2>
              <p className="mt-0.5 text-xs text-blue-900/45">{loading ? 'Loading records' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} found`}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-blue-900/55">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Field 1</th>
              <th className="px-5 py-3 font-medium text-right">Field 2</th>
              <th className="px-5 py-3 font-medium text-right">Final Total</th>
              <th className="px-5 py-3 font-medium">Added by</th>
              {canManageReports && <th className="px-5 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={canManageReports ? 7 : 6} className="px-5 py-8 text-center text-blue-900/40 font-mono text-xs">
                  loading…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={canManageReports ? 7 : 6} className="px-5 py-8 text-center text-blue-900/40">
                  No entries match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              entries.map((e) => (
                <tr key={e._id} className="border-b border-blue-50 transition last:border-0 hover:bg-blue-50/45">
                  <td className="px-5 py-4 font-medium text-blue-950">{e.name}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-blue-900/60">
                    <span
                      className={wasEdited(e) ? 'inline-flex items-center gap-2 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800' : ''}
                      title={wasEdited(e) ? `Last updated ${new Date(e.updatedAt).toLocaleString()}` : undefined}
                    >
                      {new Date(e.date).toISOString().split('T')[0]}
                      {wasEdited(e) && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">Updated</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular">{e.field1Total}</td>
                  <td className="px-5 py-3 text-right font-mono tabular">{e.field2Total}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 font-mono font-semibold tabular text-blue-800">{e.finalTotal}</span>
                  </td>
                  <td className="px-5 py-3 text-blue-900/50">{e.createdBy?.name || '—'}</td>
                  {canManageReports && <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/entry/edit/${e._id}`)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        aria-label="Edit entry"
                      >
                        <FiEdit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(e)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        aria-label="Delete entry"
                      >
                        <FiTrash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>}
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiTrash2 size={21} aria-hidden="true" />
            </div>
            <h2 id="delete-entry-title" className="font-display text-2xl text-blue-950">Delete report?</h2>
            <p className="mt-2 text-sm leading-6 text-blue-900/55">
              Are you sure you want to delete <span className="font-semibold text-blue-950">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/15 hover:bg-red-700 disabled:opacity-60"
              >
                <FiTrash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditBoxes({ title, values, names, onChange, onNameChange }: { title: string; values: number[]; names: string[]; onChange: (index: number, value: number) => void; onNameChange: (index: number, value: string) => void }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-900/65">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value, index) => (
          <div key={index} className="rounded-xl border border-blue-100 bg-blue-50/30 p-2">
            <input value={names[index] || ''} onChange={(event) => onNameChange(index, event.target.value)} aria-label={`${title} box ${index + 1} name`} className="mb-1 w-full bg-transparent text-[10px] font-semibold uppercase tracking-wider text-blue-800 outline-none" />
            <EditableNumber value={value} onChange={(nextValue) => onChange(index, nextValue)} label={`${names[index] || `Box ${index + 1}`} value`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableNumber({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const [text, setText] = useState(String(value));

  useEffect(() => setText(String(value)), [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      aria-label={label}
      onChange={(event) => {
        const next = event.target.value;
        if (!/^-?\d*(\.\d*)?$/.test(next)) return;
        setText(next);
        if (next !== '' && next !== '-' && next !== '.' && next !== '-.') onChange(Number(next));
      }}
      onBlur={() => {
        if (text === '' || text === '-' || text === '.' || text === '-.') setText(String(value));
      }}
      className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 font-mono text-sm text-blue-950 outline-none focus:border-blue-400"
    />
  );
}
