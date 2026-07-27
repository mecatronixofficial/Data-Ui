'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiColumns, FiDownload, FiEdit2, FiFileText, FiFilter, FiFlag, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { api, exportUrl, blankBoxDetail, type BoxFieldDef } from '@/lib/api';
import { type BoxDetail } from '@/components/TallyBox';
import { type Operator } from '@/components/OperatorToggle';
import DynamicFieldsForm, { FinalTotalCard, type FieldValue, fieldTotal } from '@/components/DynamicFieldsForm';

type FieldMeta = { name: string; order: number; boxNames: string[] };
type ColumnDef = { key: string; label: string };

const FIXED_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Date' },
  { key: 'total', label: 'Final Total' },
  { key: 'addedBy', label: 'Added by' },
  { key: 'updatedBy', label: 'Updated by' },
];

type EntryField = {
  name: string; boxNames: string[]; boxFields?: BoxFieldDef[][]; boxes: number[]; details: BoxDetail[][];
  calcType: 'grouped' | 'signed'; groupSplit: number; operator: string; total: number;
};
type EntryPerson = { name: string; role?: string };
type Entry = {
  _id: string; name: string; date: string; fields: EntryField[];
  fieldOperators: string[]; finalTotal: number; createdAt: string;
  updatedAt: string; createdBy?: EntryPerson; updatedBy?: EntryPerson;
};
type EditingEntry = { _id: string; name: string; date: string; fields: FieldValue[] };

function wasEdited(entry: Entry) {
  if (!entry.createdAt || !entry.updatedAt) return false;
  return new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000;
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  const isAdmin = role === 'admin' || role === 'superadmin';
  return (
    <span className={`ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User'}
    </span>
  );
}

export default function ReportsView({ roleFilter }: { roleFilter?: 'admin' | 'user' }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<EditingEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [canManageReports, setCanManageReports] = useState(false);
  const [canManageReportSettings, setCanManageReportSettings] = useState(false);
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[] | null>(null);
  const [draftColumns, setDraftColumns] = useState<Set<string>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsSaving, setColumnsSaving] = useState(false);
  const [columnsFeedback, setColumnsFeedback] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  const pageTitle = roleFilter === 'admin' ? 'Admin Reports' : roleFilter === 'user' ? 'User Reports' : 'Reports';
  const pageEyebrow = roleFilter ? 'Overview · Super Admin' : 'Overview';

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await api.allEntries({ name, startDate, endDate });
      const scoped = roleFilter ? data.filter((e: Entry) => e.createdBy?.role === roleFilter) : data;
      setEntries(scoped);
      const seen = new Map<string, { order: number; boxNames: string[] }>();
      for (const entry of scoped) {
        for (let fi = 0; fi < entry.fields.length; fi++) {
          const f = entry.fields[fi];
          if (!seen.has(f.name)) seen.set(f.name, { order: fi, boxNames: f.boxNames });
        }
      }
      setFields(Array.from(seen.entries()).map(([n, { order, boxNames }]) => ({ name: n, order, boxNames })));
    } catch (err: any) {
      setError(err.message || 'Could not load reports');
    } finally { setLoading(false); }
  }

  const dynamicColumns = useMemo<ColumnDef[]>(() =>
    [...fields].sort((a, b) => a.order - b.order).flatMap((field) =>
      field.boxNames.map((boxName, boxIndex) => ({ key: `box:${field.name}:${boxIndex}`, label: `${field.name} – ${boxName}` }))
    ), [fields]);

  const allColumns = useMemo<ColumnDef[]>(
    () => [FIXED_COLUMNS[0], FIXED_COLUMNS[1], ...dynamicColumns, FIXED_COLUMNS[2], FIXED_COLUMNS[3], FIXED_COLUMNS[4]],
    [dynamicColumns],
  );

  const visibleSet = useMemo(() => {
    if (visibleColumns === null) return new Set(allColumns.map((c) => c.key));
    const saved = new Set(visibleColumns);
    for (const c of FIXED_COLUMNS) saved.add(c.key);
    return saved;
  }, [visibleColumns, allColumns]);

  function isVisible(key: string) { return visibleSet.has(key); }

  function boxValue(entry: Entry, fieldName: string, boxIndex: number) {
    const field = entry.fields.find((f) => f.name === fieldName);
    if (!field || field.boxes[boxIndex] === undefined) return null;
    return field.boxes[boxIndex];
  }

  function toggleDraftColumn(key: string) {
    if (key === 'name') return;
    setDraftColumns((cur) => { const next = new Set(cur); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  useEffect(() => {
    if (columnsOpen && allColumns.length > 0) {
      const base = visibleColumns !== null ? new Set(visibleColumns) : new Set(allColumns.map((c) => c.key));
      base.add('name');
      setDraftColumns(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnsOpen, allColumns]);

  async function saveColumns() {
    setColumnsSaving(true); setColumnsFeedback('');
    try {
      const result = await api.updateReportSettings(Array.from(draftColumns));
      setVisibleColumns(result.visibleColumns);
      setColumnsFeedback('Report columns saved.');
    } catch (err: any) { setError(err.message || 'Could not save report columns'); }
    finally { setColumnsSaving(false); }
  }

  useEffect(() => {
    api.me().then((user) => {
      if (roleFilter && user.role !== 'superadmin') { router.replace('/dashboard/reports'); return; }
      const canView = user.permissions?.viewAllReports || user.role === 'admin' || user.role === 'superadmin';
      if (canView) {
        setCurrentUserName(user.name);
        setCanManageReports(user.role === 'superadmin');
        setCanManageReportSettings(Boolean(user.permissions?.manageReportSettings));
        load();
        api.getReportSettings().then((s) => setVisibleColumns(s.visibleColumns)).catch(() => {});
      } else { router.replace('/dashboard'); }
    }).catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteEntry(deleteTarget._id);
      setEntries((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) { setError(err.message || 'Could not remove entry'); }
    finally { setDeleting(false); }
  }

  function startEdit(entry: Entry) {
    setEditing({
      _id: entry._id, name: entry.name,
      date: new Date(entry.date).toISOString().split('T')[0],
      fields: entry.fields.map((f) => ({
        name: f.name, boxNames: [...f.boxNames], boxFields: f.boxFields, boxes: [...f.boxes],
        details: f.boxes.map((value, index) => (
          f.details?.[index]?.length ? f.details[index] : [blankBoxDetail(value)]
        )),
        calcType: f.calcType, groupSplit: f.groupSplit, operator: (f.operator as Operator) || '+',
      })),
    });
  }

  function updateEditingBox(fieldIndex: number, boxIndex: number, value: number) {
    setEditing((cur) => { if (!cur) return cur; const fs = [...cur.fields]; const boxes = [...fs[fieldIndex].boxes]; boxes[boxIndex] = value; fs[fieldIndex] = { ...fs[fieldIndex], boxes }; return { ...cur, fields: fs }; });
  }
  function updateEditingDetails(fieldIndex: number, boxIndex: number, details: BoxDetail[]) {
    setEditing((cur) => { if (!cur) return cur; const fs = [...cur.fields]; const d = [...fs[fieldIndex].details]; d[boxIndex] = details; fs[fieldIndex] = { ...fs[fieldIndex], details: d }; return { ...cur, fields: fs }; });
  }
  async function handleUpdate() {
    if (!editing) return;
    if (!editing.name.trim()) { setError('Please enter a name before saving.'); return; }
    setSaving(true); setError('');
    try {
      const updated = await api.updateEntry(editing._id, {
        name: editing.name.trim(), date: editing.date,
        fields: editing.fields.map((f) => ({ name: f.name, boxes: f.boxes, details: f.details, operator: f.operator })),
        fieldOperators: editing.fields.length > 1 ? Array(editing.fields.length - 1).fill('+') : [],
      });
      setEntries((cur) => cur.map((e) => e._id === editing._id ? { ...e, ...updated } : e));
      setEditing(null);
    } catch (err: any) { setError(err.message || 'Could not update entry'); }
    finally { setSaving(false); }
  }

  const visibleCols = allColumns.filter((c) => isVisible(c.key));
  const colSpan = visibleCols.length + (canManageReports ? 1 : 0);

  return (
    <div className="space-y-6">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-8 py-7 text-white shadow-[0_20px_50px_rgba(0,107,196,0.30)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute -left-8 -top-8 h-[180%] w-2/5 rotate-12 bg-gradient-to-br from-white/8 via-white/4 to-transparent" />
        </div>
        <div className="pointer-events-none absolute right-8 top-4 h-16 w-16 rounded-xl border border-white/10 bg-white/5 rotate-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/60">{pageEyebrow}</p>
            <h1 className="font-display text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-4xl">{pageTitle}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageReportSettings && (
              <button onClick={() => { setColumnsOpen((o) => !o); setColumnsFeedback(''); }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm transition hover:bg-white/15">
                <FiColumns size={16} /> Field
              </button>
            )}
            <a href={exportUrl({ name, startDate, endDate })}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-500">
              <FiDownload size={16} /> Excel
            </a>
            <a href={exportUrl({ name, startDate, endDate }, 'pdf')}
              className="flex items-center gap-2 rounded-xl bg-rose-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(244,63,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:bg-rose-500">
              <FiDownload size={16} /> PDF
            </a>
          </div>
        </div>
      </div>

      {/* ── Columns panel ── */}
      {columnsOpen && canManageReportSettings && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.10)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
                <FiFlag size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Super Admin</p>
                <h2 className="font-display text-xl text-blue-950">Report field</h2>
              </div>
            </div>
            <button onClick={() => setColumnsOpen(false)} aria-label="Close" className="rounded-lg p-2 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700"><FiX /></button>
          </div>
          <p className="mb-3 text-xs text-blue-900/50">Name, Date, Final Total, Added by and Updated by always show. Choose which extra field boxes appear in the table below.</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {dynamicColumns.length === 0 && <p className="text-sm text-blue-900/40">No extra fields configured yet.</p>}
            {dynamicColumns.map((col) => (
              <label key={col.key} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${draftColumns.has(col.key) ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-blue-100 bg-white text-blue-900/50'}`}>
                <input type="checkbox" checked={draftColumns.has(col.key)} onChange={() => toggleDraftColumn(col.key)} className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                {col.label}
              </label>
            ))}
          </div>
          {columnsFeedback && <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><FiCheck />{columnsFeedback}</p>}
          <button onClick={saveColumns} disabled={columnsSaving}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <span className="relative flex items-center gap-2"><FiCheck />{columnsSaving ? 'Saving...' : 'Save columns'}</span>
          </button>
        </div>
      )}

      {/* ── Filter card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiFilter size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Filter records</h2>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Name</label>
            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15">
              <FiSearch className="text-blue-500" size={14} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Search by name" className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-900/35" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <button onClick={load}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <span className="relative">Filter</span>
          </button>
        </div>
      </div>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}

      {/* ── Edit panel ── */}
      {editing && (
        <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.10)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Admin action</p>
              <h2 className="font-display text-2xl text-blue-950">Edit record</h2>
            </div>
            <button onClick={() => setEditing(null)} aria-label="Close editor" className="rounded-lg p-2 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700"><FiX /></button>
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/65">Name
              <input value={editing.name} onChange={(e) => setEditing((c) => c && { ...c, name: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-blue-400" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/65">Date
              <input type="date" value={editing.date} onChange={(e) => setEditing((c) => c && { ...c, date: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-blue-400" />
            </label>
          </div>
          <div className="space-y-5">
            <DynamicFieldsForm fields={editing.fields} currentUserName={currentUserName} onBoxChange={updateEditingBox} onDetailsChange={updateEditingDetails} />
            <FinalTotalCard fieldNames={editing.fields.map((f) => f.name)} fieldTotals={editing.fields.map(fieldTotal)} />
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleUpdate} disabled={saving}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2"><FiCheck />{saving ? 'Saving...' : 'Save changes'}</span>
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-blue-200 px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50">Cancel</button>
          </div>
        </section>
      )}

      {/* ── Table ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiFileText size={17} />
          </div>
          <h2 className="font-display text-xl text-blue-950">Production records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-blue-900/55">
                {visibleCols.map((col) => (
                  <th key={col.key} className={`px-5 py-3 font-medium ${col.key === 'total' ? 'text-right' : ''}`}>{col.label}</th>
                ))}
                {canManageReports && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={colSpan} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-900/40">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                    <span className="font-mono text-xs">loading…</span>
                  </div>
                </td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-blue-900/40">No entries match these filters.</td></tr>
              )}
              {!loading && entries.map((e) => (
                <tr key={e._id} className="border-b border-blue-50 transition last:border-0 hover:bg-blue-50/40">
                  {visibleCols.map((col) => {
                    if (col.key === 'name') return <td key={col.key} className="px-5 py-4 font-medium text-blue-950">{e.name}</td>;
                    if (col.key === 'date') return (
                      <td key={col.key} className="whitespace-nowrap px-5 py-3 font-mono text-blue-900/60">
                        <span className={wasEdited(e) ? 'inline-flex items-center gap-2 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800' : ''} title={wasEdited(e) ? `Updated ${new Date(e.updatedAt).toLocaleString()}` : undefined}>
                          {new Date(e.date).toISOString().split('T')[0]}
                          {wasEdited(e) && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">Updated</span>}
                        </span>
                      </td>
                    );
                    if (col.key === 'total') return (
                      <td key={col.key} className="px-5 py-3 text-right">
                        <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 font-mono font-semibold text-blue-800">{e.finalTotal}</span>
                      </td>
                    );
                    if (col.key === 'addedBy') return (
                      <td key={col.key} className="px-5 py-3 text-blue-900/50">
                        <span className="inline-flex items-center">{e.createdBy?.name || '—'}<RoleBadge role={e.createdBy?.role} /></span>
                      </td>
                    );
                    if (col.key === 'updatedBy') return (
                      <td key={col.key} className="px-5 py-3 text-blue-900/50">
                        {wasEdited(e)
                          ? <span className="inline-flex items-center">{e.updatedBy?.name || '—'}<RoleBadge role={e.updatedBy?.role} /></span>
                          : '—'}
                      </td>
                    );
                    const lastColon = col.key.lastIndexOf(':');
                    const fieldName = col.key.slice('box:'.length, lastColon);
                    const boxIndexRaw = col.key.slice(lastColon + 1);
                    const value = boxValue(e, fieldName, Number(boxIndexRaw));
                    return (
                      <td key={col.key} className="px-5 py-3 text-blue-900/60">
                        <span className="rounded-lg bg-blue-50 px-2 py-1 font-mono text-xs text-blue-800">{value === null ? '—' : value}</span>
                      </td>
                    );
                  })}
                  {canManageReports && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(e)} aria-label="Edit" className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(e)} aria-label="Delete" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="delete-entry-title"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-200/60 to-transparent" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.2)]">
              <FiTrash2 size={20} />
            </div>
            <h2 id="delete-entry-title" className="font-display text-2xl text-blue-950">Delete record?</h2>
            <p className="mt-2 text-sm leading-6 text-blue-900/55">
              Are you sure you want to delete <span className="font-semibold text-blue-950">{deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)] transition hover:-translate-y-0.5 hover:bg-red-700 disabled:opacity-60">
                <FiTrash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
