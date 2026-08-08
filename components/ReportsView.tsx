'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiClock, FiColumns, FiDownload, FiEdit2, FiExternalLink, FiFileText, FiFilter, FiFlag, FiSearch, FiShield, FiTrash2, FiX } from 'react-icons/fi';
import { api, exportUrl, blankBoxDetail, computeFieldLocked, type BoxFieldDef, type FinalTotalSign } from '@/lib/api';
import { toast } from '@/lib/toast';
import { type BoxDetail } from '@/components/TallyBox';
import { type Operator } from '@/components/OperatorToggle';
import DynamicFieldsForm, { FinalTotalCard, type FieldValue } from '@/components/DynamicFieldsForm';

type FieldMeta = { name: string; order: number; boxNames: string[] };
type FieldDefinition = FieldMeta & {
  icon?: string;
  color?: string;
  boxIcons?: string[];
  boxColors?: string[];
  boxFields?: BoxFieldDef[][];
  calcType: 'grouped' | 'signed';
  groupSplit: number;
  userOnlyEdit?: boolean;
};
type ColumnDef = { key: string; label: string };

const FIXED_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'team', label: 'Team' },
  { key: 'date', label: 'Date' },
  { key: 'total', label: 'Final Total' },
  { key: 'addedBy', label: 'Added by' },
  { key: 'updatedBy', label: 'Updated by' },
];

type EntryField = {
  name: string; boxNames: string[]; boxFields?: BoxFieldDef[][]; boxes: number[]; details: BoxDetail[][];
  calcType: 'grouped' | 'signed'; groupSplit: number; operator: string; total: number;
};
type EntryPerson = { _id?: string; name: string; role?: string };
type Account = { _id: string; name: string; role: string; teamName?: string; assignedAdminId?: string | null };
type EntryChange = { label: string; from: string | number | null; to: string | number | null };
type EntryHistoryItem = { updatedAt: string; updatedBy?: EntryPerson; changes: EntryChange[] };
type Entry = {
  _id: string; name: string; date: string; fields: EntryField[];
  fieldOperators: string[]; finalTotal: number; createdAt: string;
  updatedAt: string; createdBy?: EntryPerson; updatedBy?: EntryPerson;
  ownerAccountId?: string; ownerRole?: 'admin' | 'user'; teamAdminId?: string; teamName?: string;
  history?: EntryHistoryItem[];
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

export default function ReportsView({
  scope = 'mine',
}: {
  scope?: 'mine' | 'team' | 'all';
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [historyEntry, setHistoryEntry] = useState<Entry | null>(null);
  const [historyItems, setHistoryItems] = useState<EntryHistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [role, setRole] = useState('');
  const [canManageReports, setCanManageReports] = useState(false);
  const [canEditReports, setCanEditReports] = useState(false);
  const [canManageReportSettings, setCanManageReportSettings] = useState(false);
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[] | null>(null);
  const [draftColumns, setDraftColumns] = useState<Set<string>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsSaving, setColumnsSaving] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [editLocks, setEditLocks] = useState<Map<string, boolean>>(new Map());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teamFilter, setTeamFilter] = useState('');
  const [finalTotalLabel, setFinalTotalLabel] = useState('Final Total');
  const [finalTotalIcon, setFinalTotalIcon] = useState('');
  const [finalTotalSign, setFinalTotalSign] = useState<FinalTotalSign>('add');

  const pageTitle = scope === 'team'
    ? (currentTeamName ? `${currentTeamName} Report` : 'Team Report')
    : role === 'superadmin'
      ? 'Team Reports'
      : 'Report';
  const pageEyebrow = scope === 'team' ? 'Your team' : 'Super Admin';

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await api.allEntries({
        name,
        startDate,
        endDate,
        scope,
        teamName: teamFilter || undefined,
      });
      setEntries(data);
      const seen = new Map<string, { order: number; boxNames: string[] }>();
      for (const entry of data) {
        for (let fi = 0; fi < entry.fields.length; fi++) {
          const f = entry.fields[fi];
          if (!seen.has(f.name)) seen.set(f.name, { order: fi, boxNames: f.boxNames });
        }
      }
      setFields(Array.from(seen.entries()).map(([n, { order, boxNames }]) => ({ name: n, order, boxNames })));
    } catch (err: any) {
      toast.error(err.message || 'Could not load reports');
    } finally { setLoading(false); }
  }

  const reportFields = useMemo<FieldMeta[]>(() => {
    const combined = new Map<string, FieldMeta>();
    for (const field of fieldDefinitions) combined.set(field.name, field);
    for (const field of fields) {
      if (!combined.has(field.name)) combined.set(field.name, field);
    }
    return Array.from(combined.values());
  }, [fieldDefinitions, fields]);

  const dynamicColumns = useMemo<ColumnDef[]>(() =>
    [...reportFields].sort((a, b) => a.order - b.order).flatMap((field) =>
      field.boxNames.map((boxName, boxIndex) => ({ key: `box:${field.name}:${boxIndex}`, label: `${field.name} – ${boxName}` }))
    ), [reportFields]);

  const allColumns = useMemo<ColumnDef[]>(
    () => [FIXED_COLUMNS[0], FIXED_COLUMNS[1], FIXED_COLUMNS[2], ...dynamicColumns, FIXED_COLUMNS[3], FIXED_COLUMNS[4], FIXED_COLUMNS[5]],
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

  const admins = useMemo(() => accounts.filter((a) => a.role === 'admin'), [accounts]);
  const displayedEntries = entries;

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
    setColumnsSaving(true);
    try {
      const result = await api.updateReportSettings(Array.from(draftColumns));
      setVisibleColumns(result.visibleColumns);
    } catch {
      // The API client shows the error notification.
    }
    finally { setColumnsSaving(false); }
  }

  useEffect(() => {
    api.me().then((user) => {
      if (scope === 'team' && user.role !== 'admin') { router.replace('/dashboard/reports'); return; }
      if (user.role === 'user') { router.replace('/dashboard'); return; }
      if (user.role === 'admin' && scope !== 'team') { router.replace('/dashboard/reports/team'); return; }
      const canView = user.role === 'admin' || user.role === 'superadmin';
      if (canView) {
        setCurrentUserName(user.name);
        setCurrentTeamName(user.teamName || '');
        setRole(user.role || '');
        setCanManageReports(user.role === 'superadmin');
        setCanEditReports(user.role === 'admin' || user.role === 'superadmin');
        setCanManageReportSettings(Boolean(user.permissions?.manageReportSettings));
        load();
        api.getReportSettings().then((s) => setVisibleColumns(s.visibleColumns)).catch(() => {});
        api.getFieldEditLocks().then((locks) => setEditLocks(new Map(locks.map((l) => [l.name, l.userOnlyEdit])))).catch(() => {});
        api.getFields().then((configured) => setFieldDefinitions(configured)).catch(() => {});
        api.getFinalTotalSettings().then((s) => { setFinalTotalLabel(s.label); setFinalTotalIcon(s.icon); setFinalTotalSign(s.sign); }).catch(() => {});
        if (user.role === 'superadmin') {
          api.listUsers().then(setAccounts).catch(() => {});
        }
      } else { router.replace('/dashboard'); }
    }).catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, scope]);

  useEffect(() => {
    // 'focus' and 'visibilitychange' both fire when switching back to this tab;
    // coalesce them with a timer so we only refetch once per return-to-tab.
    let pending: ReturnType<typeof setTimeout> | null = null;
    const refreshOnFocus = () => {
      if (document.visibilityState !== 'visible') return;
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { pending = null; load(true); }, 150);
    };
    // Keep an admin's team view current while it stays open. User saves update the
    // same team report, so the next refresh shows the new values without a reload.
    const liveRefresh = scope === 'team'
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') load(true);
        }, 5000)
      : null;
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      if (pending) clearTimeout(pending);
      if (liveRefresh) window.clearInterval(liveRefresh);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
    // Reload the current report filters when returning from an entry-save tab/page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, startDate, endDate, scope, teamFilter]);

  async function openHistory(entry: Entry) {
    setHistoryEntry(entry);
    setHistoryItems(null);
    setHistoryLoading(true);
    try {
      const full = await api.getEntry(entry._id);
      setHistoryItems(full.history || []);
    } catch (err: any) {
      toast.error(err.message || 'Could not load update history');
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryEntry(null);
    setHistoryItems(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteEntry(deleteTarget._id);
      setEntries((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // The API client shows the error notification.
    }
    finally { setDeleting(false); }
  }

  function startEdit(entry: Entry) {
    const savedByName = new Map(entry.fields.map((field) => [field.name, field]));
    const editableFields: FieldValue[] = fieldDefinitions.length > 0
      ? fieldDefinitions.map((definition) => {
          const saved = savedByName.get(definition.name);
          const boxes = definition.boxNames.map((_, index) => saved?.boxes?.[index] ?? 0);
          return {
            name: definition.name,
            icon: definition.icon || '',
            color: definition.color || '',
            boxNames: [...definition.boxNames],
            boxIcons: [...(definition.boxIcons || [])],
            boxColors: [...(definition.boxColors || [])],
            boxFields: definition.boxFields,
            boxes,
            details: definition.boxNames.map((_, index) => (
              saved?.details?.[index]?.length
                ? saved.details[index]
                : [blankBoxDetail(boxes[index])]
            )),
            calcType: definition.calcType,
            groupSplit: definition.groupSplit,
            operator: (saved?.operator as Operator) || '+',
            locked: computeFieldLocked(
              role,
              editLocks.get(definition.name) ?? Boolean(definition.userOnlyEdit),
            ),
          };
        })
      : entry.fields.map((field) => ({
          name: field.name,
          boxNames: [...field.boxNames],
          boxFields: field.boxFields,
          boxes: [...field.boxes],
          details: field.boxes.map((value, index) => (
            field.details?.[index]?.length ? field.details[index] : [blankBoxDetail(value)]
          )),
          calcType: field.calcType,
          groupSplit: field.groupSplit,
          operator: (field.operator as Operator) || '+',
          locked: computeFieldLocked(role, Boolean(editLocks.get(field.name))),
        }));

    setEditing({
      _id: entry._id, name: entry.name,
      date: new Date(entry.date).toISOString().split('T')[0],
      fields: editableFields,
    });
  }

  function updateEditingBox(fieldIndex: number, boxIndex: number, value: number) {
    setEditing((cur) => { if (!cur) return cur; const fs = [...cur.fields]; const boxes = [...fs[fieldIndex].boxes]; boxes[boxIndex] = value; fs[fieldIndex] = { ...fs[fieldIndex], boxes }; return { ...cur, fields: fs }; });
  }
  function updateEditingDetails(fieldIndex: number, boxIndex: number, details: BoxDetail[]) {
    setEditing((cur) => { if (!cur) return cur; const fs = [...cur.fields]; const d = [...fs[fieldIndex].details]; d[boxIndex] = details; fs[fieldIndex] = { ...fs[fieldIndex], details: d }; return { ...cur, fields: fs }; });
  }
  function resetEditingField(fieldIndex: number) {
    setEditing((cur) => {
      if (!cur) return cur;
      const fs = [...cur.fields];
      const f = fs[fieldIndex];
      fs[fieldIndex] = { ...f, boxes: f.boxes.map(() => 0), details: f.boxes.map(() => []) };
      return { ...cur, fields: fs };
    });
  }
  async function handleUpdate() {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Please enter a name before saving.'); return; }
    setSaving(true);
    try {
      const updated = await api.updateEntry(editing._id, {
        name: editing.name.trim(), date: editing.date,
        fields: editing.fields.map((f) => ({ name: f.name, boxes: f.boxes, details: f.details, operator: f.operator })),
      });
      setEntries((cur) => cur.map((e) => e._id === editing._id ? { ...e, ...updated } : e));
      setEditing(null);
    } catch {
      // The API client shows the error notification.
    }
    finally { setSaving(false); }
  }

  const visibleCols = allColumns.filter((c) => isVisible(c.key));
  const colSpan = visibleCols.length + ((canEditReports || canManageReports) ? 1 : 0);

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
              <button onClick={() => setColumnsOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm transition hover:bg-white/15">
                <FiColumns size={16} /> Field
              </button>
            )}
            <a href={exportUrl({ name, startDate, endDate, scope, teamName: teamFilter || undefined })}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-500">
              <FiDownload size={16} /> Excel
            </a>
            <a href={exportUrl({ name, startDate, endDate, scope, teamName: teamFilter || undefined }, 'pdf')}
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-900">Super Admin</p>
                <h2 className="font-display text-xl text-blue-950">Report field</h2>
              </div>
            </div>
            <button onClick={() => setColumnsOpen(false)} aria-label="Close" className="rounded-lg p-2 text-black hover:bg-blue-50 hover:text-blue-950"><FiX /></button>
          </div>
          <p className="mb-3 text-xs text-black">Name, Team, Date, {finalTotalLabel}, Added by and Updated by always show. Choose which extra field boxes appear in the table below.</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {dynamicColumns.length === 0 && <p className="text-sm text-black">No extra fields configured yet.</p>}
            {dynamicColumns.map((col) => (
              <label key={col.key} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${draftColumns.has(col.key) ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-blue-100 bg-white text-black'}`}>
                <input type="checkbox" checked={draftColumns.has(col.key)} onChange={() => toggleDraftColumn(col.key)} className="h-4 w-4 rounded border-blue-300 text-blue-900 focus:ring-blue-500" />
                {col.label}
              </label>
            ))}
          </div>
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
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Name</label>
            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15">
              <FiSearch className="text-blue-800" size={14} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Search by name" className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-black" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 font-mono text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
          </div>
          {role === 'superadmin' && admins.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">Team</label>
              <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15">
                <option value="">All teams</option>
                {admins.filter((a) => a.teamName).map((a) => (
                  <option key={a._id} value={a.teamName}>{a.teamName}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={() => load()}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)] active:translate-y-0">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <span className="relative">Filter</span>
          </button>
        </div>
      </div>

      {/* ── Edit panel ── */}
      {editing && (
        <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.10)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-900">Admin action</p>
              <h2 className="font-display text-2xl text-blue-950">Edit record</h2>
            </div>
            <button onClick={() => setEditing(null)} aria-label="Close editor" className="rounded-lg p-2 text-black hover:bg-blue-50 hover:text-blue-950"><FiX /></button>
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-black">Team report
              <input
                value={editing.name}
                readOnly
                className="mt-2 w-full cursor-default rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm normal-case tracking-normal outline-none"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-black">Date
              <input type="date" value={editing.date} onChange={(e) => setEditing((c) => c && { ...c, date: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-blue-400" />
            </label>
          </div>
          <div className="space-y-5">
            <DynamicFieldsForm fields={editing.fields} currentUserName={currentUserName} canReset={canManageReports} onBoxChange={updateEditingBox} onDetailsChange={updateEditingDetails} onResetField={resetEditingField} />
            <FinalTotalCard fields={editing.fields} label={finalTotalLabel} icon={finalTotalIcon} sign={finalTotalSign} />
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
              <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-black">
                {visibleCols.map((col) => (
                  <th key={col.key} className={`px-5 py-3 font-medium ${col.key === 'total' ? 'text-right' : ''}`}>{col.key === 'total' ? finalTotalLabel : col.label}</th>
                ))}
                {(canEditReports || canManageReports) && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={colSpan} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-black">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                    <span className="font-mono text-xs">loading…</span>
                  </div>
                </td></tr>
              )}
              {!loading && displayedEntries.length === 0 && (
                <tr><td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-black">No entries match these filters.</td></tr>
              )}
              {!loading && displayedEntries.map((e) => (
                <tr key={e._id} className="border-b border-blue-50 transition last:border-0 hover:bg-blue-50/40">
                  {visibleCols.map((col) => {
                    if (col.key === 'name') return <td key={col.key} className="px-5 py-4 font-medium text-blue-950">{e.name}</td>;
                    if (col.key === 'team') return (
                      <td key={col.key} className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          <FiShield size={11} />
                          {e.teamName || 'Legacy / Unassigned'}
                        </span>
                      </td>
                    );
                    if (col.key === 'date') return (
                      <td key={col.key} className="whitespace-nowrap px-5 py-3 font-mono text-black">
                        <span className={wasEdited(e) ? 'inline-flex items-center gap-2 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800' : ''} title={wasEdited(e) ? `Updated ${new Date(e.updatedAt).toLocaleString()}` : undefined}>
                          {new Date(e.date).toISOString().split('T')[0]}
                          {wasEdited(e) && (
                            <button
                              onClick={() => openHistory(e)}
                              className="flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-900 transition hover:bg-amber-300"
                              title="View update history"
                            >
                              <FiClock size={9} /> Updated
                            </button>
                          )}
                        </span>
                      </td>
                    );
                    if (col.key === 'total') return (
                      <td key={col.key} className="px-5 py-3 text-right">
                        <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 font-mono font-semibold text-blue-800">{e.finalTotal}</span>
                      </td>
                    );
                    if (col.key === 'addedBy') return (
                      <td key={col.key} className="px-5 py-3 text-black">
                        <span className="inline-flex items-center">{e.createdBy?.name || '—'}<RoleBadge role={e.createdBy?.role} /></span>
                      </td>
                    );
                    if (col.key === 'updatedBy') return (
                      <td key={col.key} className="px-5 py-3 text-black">
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
                      <td key={col.key} className="px-5 py-3 text-black">
                        <span className="rounded-lg bg-blue-50 px-2 py-1 font-mono text-xs text-blue-800">{value === null ? '—' : value}</span>
                      </td>
                    );
                  })}
                  {(canEditReports || canManageReports) && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canEditReports && (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/entry/edit/${e._id}`)}
                              aria-label="Open shared entry page"
                              title="Open shared entry page"
                              className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                            >
                              <FiExternalLink size={14} />
                            </button>
                            <button onClick={() => startEdit(e)} aria-label="Quick edit" title="Quick edit" className="rounded-lg p-2 text-blue-900 transition hover:bg-blue-50">
                              <FiEdit2 size={14} />
                            </button>
                          </>
                        )}
                        {canManageReports && (
                          <button onClick={() => setDeleteTarget(e)} aria-label="Delete" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50">
                            <FiTrash2 size={14} />
                          </button>
                        )}
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
            <p className="mt-2 text-sm leading-6 text-black">
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

      {/* ── History modal ── */}
      {historyEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="history-entry-title"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeHistory(); }}>
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-white shadow-[0_4px_12px_rgba(217,119,6,0.35)]">
                  <FiClock size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-900">Update history</p>
                  <h2 id="history-entry-title" className="font-display text-xl text-blue-950">{historyEntry.name}</h2>
                </div>
              </div>
              <button onClick={closeHistory} aria-label="Close" className="rounded-lg p-2 text-black hover:bg-blue-50 hover:text-blue-950"><FiX /></button>
            </div>

            {historyLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-black">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                <span className="font-mono text-xs">loading…</span>
              </div>
            )}

            {!historyLoading && historyItems && historyItems.length === 0 && (
              <p className="py-8 text-center text-sm text-black">No recorded changes yet.</p>
            )}

            {!historyLoading && historyItems && historyItems.length > 0 && (
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                <p className="text-xs text-black">Showing the last {historyItems.length} update{historyItems.length === 1 ? '' : 's'}, most recent first.</p>
                {historyItems.map((item, index) => (
                  <div key={index} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center">
                        <span className="font-medium text-blue-950">{item.updatedBy?.name || '—'}</span>
                        <RoleBadge role={item.updatedBy?.role} />
                      </span>
                      <span className="font-mono text-xs text-black">{new Date(item.updatedAt).toLocaleString()}</span>
                    </div>
                    <ul className="space-y-1">
                      {item.changes.map((change, ci) => (
                        <li key={ci} className="flex flex-wrap items-center gap-1.5 text-xs text-black">
                          <span className="font-medium text-blue-950">{change.label}:</span>
                          <span className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-red-700 line-through">{change.from === null ? '—' : change.from}</span>
                          <span className="text-blue-700">→</span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">{change.to === null ? '—' : change.to}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
