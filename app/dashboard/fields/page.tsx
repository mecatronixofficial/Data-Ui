'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiChevronDown, FiChevronUp, FiEye, FiEyeOff, FiLock, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import { api, type BoxFieldDef, type FinalTotalSign } from '@/lib/api';
import { toast } from '@/lib/toast';
import IconPicker, { FieldIcon } from '@/components/IconPicker';
import ColorPicker, { boxColorHex } from '@/components/ColorPicker';

type CalcType = 'grouped' | 'signed';
type FinalTotalSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type AccountSummary = { _id: string; name: string; email: string; role: string };

type FieldRow = {
  _id?: string;
  name: string;
  icon: string;
  // This field's own accent color (used for a decorative accent only — never applied
  // to the icon above, which always keeps its own fixed color).
  color: string;
  boxNames: string[];
  boxIcons: string[];
  boxColors: string[];
  boxFields: BoxFieldDef[][];
  calcType: CalcType;
  groupSplit: number;
  userOnlyEdit: boolean;
  // Account ids allowed to see this field on their entry/reports pages. Empty = everyone.
  visibleTo: string[];
};

// A box's inner detail-table columns default to this plain Name/Value pair.
const SIMPLE_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'Name', type: 'text' },
  { label: 'Value', type: 'number', sumTotal: true },
];

// One-click preset for currency-conversion style boxes: the user only ever enters USD.
// USD Rate and Bonus % are both percentages the superadmin sets here (auto: 'constant') —
// they show read-only on the entry form. INR and Value are derived and read-only too.
const CURRENCY_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'USD', type: 'number' },
  { label: 'USD Rate', type: 'number', auto: 'constant', constant: 10 },
  { label: 'INR', type: 'computed', formula: { op: 'percentAdd', a: 'USD', b: 'USD Rate' } },
  { label: 'Bonus %', type: 'number', auto: 'constant', constant: 10 },
  { label: 'Value', type: 'computed', formula: { op: 'percentAdd', a: 'INR', b: 'Bonus %' }, sumTotal: true },
];

// One-click preset for a crypto-style box: the user only enters USD, the superadmin sets
// the USD->INR rate once (auto: 'constant'), and INR is derived (USD x rate). +USD/-USD/
// +INR/-INR are filled in automatically by TallyBox (positive USD/INR go to the "+" column,
// negative go to the "-" column) — they're never typed in directly. Only INR is flagged
// sumTotal, so the box's main total (shown on the closed box tile) is the INR value; the
// four +/- columns instead show as separate totals along the bottom of the open box.
const CRYPTO_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'USD', type: 'number' },
  { label: 'INR per USD', type: 'number', auto: 'constant', constant: 90 },
  { label: 'INR', type: 'computed', formula: { op: 'multiply', a: 'USD', b: 'INR per USD' }, sumTotal: true },
  { label: '+USD', type: 'number' },
  { label: '-USD', type: 'number' },
  { label: '+INR', type: 'number' },
  { label: '-INR', type: 'number' },
];

// One-click preset matching the "S.No / Date / Time / In / Out / From / To / Sent By"
// layout. Out adds to the box total, In subtracts from it (e.g. 2000 Out - 1500 In = 500).
const TEAM_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'S.No', type: 'number', auto: 'serial' },
  { label: 'Date', type: 'date' },
  { label: 'Time', type: 'time' },
  { label: 'In', type: 'number', sumTotal: true, sumSign: 'subtract' },
  { label: 'Out', type: 'number', sumTotal: true },
  { label: 'From', type: 'text' },
  { label: 'To', type: 'text' },
  { label: 'Sent By', type: 'text', auto: 'user' },
];

type ConfirmDelete = { index: number; name: string };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function normalizeField(value: unknown): FieldRow {
  const field = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const rawBoxNames = Array.isArray(field.boxNames) ? field.boxNames : [];
  const boxNames = rawBoxNames.length
    ? rawBoxNames.map((name, index) => typeof name === 'string' ? name : `Box ${index + 1}`)
    : ['Box 1'];
  const rawBoxIcons = Array.isArray(field.boxIcons) ? field.boxIcons : [];
  const rawBoxColors = Array.isArray(field.boxColors) ? field.boxColors : [];
  const rawBoxFields = Array.isArray(field.boxFields) ? field.boxFields : [];

  return {
    _id: typeof field._id === 'string' ? field._id : undefined,
    name: typeof field.name === 'string' ? field.name : '',
    icon: typeof field.icon === 'string' ? field.icon : '',
    color: typeof field.color === 'string' ? field.color : '',
    boxNames,
    boxIcons: boxNames.map((_, index) => typeof rawBoxIcons[index] === 'string' ? rawBoxIcons[index] : ''),
    boxColors: boxNames.map((_, index) => typeof rawBoxColors[index] === 'string' ? rawBoxColors[index] : ''),
    boxFields: boxNames.map((_, index) => Array.isArray(rawBoxFields[index]) && rawBoxFields[index].length
      ? rawBoxFields[index] as BoxFieldDef[]
      : SIMPLE_BOX_FIELDS),
    calcType: field.calcType === 'grouped' ? 'grouped' : 'signed',
    groupSplit: typeof field.groupSplit === 'number' ? field.groupSplit : 0,
    userOnlyEdit: Boolean(field.userOnlyEdit),
    visibleTo: Array.isArray(field.visibleTo)
      ? field.visibleTo.filter((id): id is string => typeof id === 'string')
      : [],
  };
}

function isAccountSummary(value: unknown): value is AccountSummary {
  if (!value || typeof value !== 'object') return false;
  const account = value as Record<string, unknown>;
  return typeof account._id === 'string'
    && typeof account.name === 'string'
    && typeof account.email === 'string'
    && (account.role === 'admin' || account.role === 'user');
}

export default function FieldsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);
  const [boxEditor, setBoxEditor] = useState<{ index: number; boxIndex: number } | null>(null);
  const [visibilityEditor, setVisibilityEditor] = useState<number | null>(null);
  // Users/admins available to pick from in the visibility editor (superadmin only).
  const [allAccounts, setAllAccounts] = useState<AccountSummary[]>([]);
  // true only for super admin (manageFields permission)
  const [canEdit, setCanEdit] = useState(false);

  // The label/icon/sign shown on the "Final Total" card (entry page) and Reports column header.
  const [finalTotalLabel, setFinalTotalLabelState] = useState('Final Total');
  const [finalTotalIcon, setFinalTotalIconState] = useState('');
  const [finalTotalSign, setFinalTotalSignState] = useState<FinalTotalSign>('add');
  const [finalTotalSaveStatus, setFinalTotalSaveStatus] = useState<FinalTotalSaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.me(),
      api.getFields(),
      api.getFinalTotalSettings().catch((error: unknown) => {
        if (!cancelled) toast.error(errorMessage(error, 'Could not load Final Total settings'));
        return { label: 'Final Total', icon: '', sign: 'add' as FinalTotalSign };
      }),
      api.listUsers().catch(() => []),
    ])
      .then(([user, fields, finalTotalSettings, accounts]) => {
        if (cancelled) return;
        const hasManage = Boolean(user.permissions?.manageFields);
        if (!hasManage) {
          setCanEdit(false);
          router.replace('/dashboard');
          return;
        }

        setCanEdit(true);
        setRows(Array.isArray(fields) ? fields.map(normalizeField) : []);
        setAllAccounts(Array.isArray(accounts) ? accounts.filter(isAccountSummary) : []);
        setFinalTotalLabelState(finalTotalSettings.label || 'Final Total');
        setFinalTotalIconState(finalTotalSettings.icon || '');
        setFinalTotalSignState(finalTotalSettings.sign === 'subtract' ? 'subtract' : 'add');
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(errorMessage(error, 'Could not load field settings'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (finalTotalSaveStatus !== 'saved') return;
    const timer = window.setTimeout(() => setFinalTotalSaveStatus('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [finalTotalSaveStatus]);

  useEffect(() => {
    if (!confirmDelete && !boxEditor && visibilityEditor === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (confirmDelete) setConfirmDelete(null);
      else if (boxEditor) setBoxEditor(null);
      else setVisibilityEditor(null);
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [boxEditor, confirmDelete, visibilityEditor]);

  async function selectFinalTotalSign(sign: FinalTotalSign) {
    if (!canEdit || finalTotalSaveStatus === 'saving') return;

    const previousSign = finalTotalSign;
    setFinalTotalSignState(sign);
    setFinalTotalSaveStatus('saving');
    try {
      const result = await api.updateFinalTotalSettings({
        label: finalTotalLabel.trim() || 'Final Total',
        icon: finalTotalIcon,
        sign,
      });
      setFinalTotalLabelState(result.label);
      setFinalTotalIconState(result.icon);
      setFinalTotalSignState(result.sign);
      setFinalTotalSaveStatus('saved');
    } catch {
      setFinalTotalSignState(previousSign);
      setFinalTotalSaveStatus('error');
    }
  }

  function updateRow(index: number, changes: Partial<FieldRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function addField() {
    const fieldName = `Field ${rows.length + 1}`;
    setRows((prev) => [
      ...prev,
      {
        name: fieldName,
        icon: '',
        color: '',
        boxNames: ['Box 1'],
        boxIcons: [''],
        boxColors: [''],
        boxFields: [SIMPLE_BOX_FIELDS],
        calcType: 'signed',
        groupSplit: 0,
        userOnlyEdit: false,
        visibleTo: [],
      },
    ]);
    toast.info(`"${fieldName}" added. Click Save to keep it.`);
  }

  function removeField(index: number) {
    setConfirmDelete({ index, name: rows[index].name });
  }

  function cancelRemoveField() {
    setConfirmDelete(null);
  }

  async function confirmRemoveField() {
    if (!confirmDelete) return;
    const { index, name } = confirmDelete;
    const row = rows[index];
    if (row._id) {
      try {
        await api.deleteField(row._id);
      } catch {
        // The API client shows the error notification.
        setConfirmDelete(null);
        return;
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
    setConfirmDelete(null);
    if (!row._id) toast.info(`"${name}" was removed.`);
  }

  function moveField(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addBox(index: number) {
    const row = rows[index];
    updateRow(index, {
      boxNames: [...row.boxNames, `Box ${row.boxNames.length + 1}`],
      boxIcons: [...row.boxIcons, ''],
      boxColors: [...row.boxColors, ''],
      boxFields: [...row.boxFields, SIMPLE_BOX_FIELDS],
    });
  }

  function removeBox(index: number, boxIndex: number) {
    const row = rows[index];
    if (row.boxNames.length <= 1) return;
    const boxNames = row.boxNames.filter((_, i) => i !== boxIndex);
    const boxIcons = row.boxIcons.filter((_, i) => i !== boxIndex);
    const boxColors = row.boxColors.filter((_, i) => i !== boxIndex);
    const boxFields = row.boxFields.filter((_, i) => i !== boxIndex);
    const changes: Partial<FieldRow> = { boxNames, boxIcons, boxColors, boxFields };
    if (row.calcType === 'grouped') {
      changes.groupSplit = Math.min(row.groupSplit, Math.max(1, boxNames.length - 1));
    }
    updateRow(index, changes);
  }

  function updateBoxName(index: number, boxIndex: number, value: string) {
    const row = rows[index];
    const boxNames = [...row.boxNames];
    boxNames[boxIndex] = value;
    updateRow(index, { boxNames });
  }

  function updateBoxIcon(index: number, boxIndex: number, icon: string) {
    const row = rows[index];
    const boxIcons = [...row.boxIcons];
    boxIcons[boxIndex] = icon;
    updateRow(index, { boxIcons });
  }

  function updateBoxColor(index: number, boxIndex: number, color: string) {
    const row = rows[index];
    const boxColors = [...row.boxColors];
    boxColors[boxIndex] = color;
    updateRow(index, { boxColors });
  }

  function updateBoxFields(index: number, boxIndex: number, fields: BoxFieldDef[]) {
    const row = rows[index];
    const boxFields = [...row.boxFields];
    boxFields[boxIndex] = fields;
    updateRow(index, { boxFields });
  }

  function setCalcType(index: number, calcType: CalcType) {
    const row = rows[index];
    updateRow(index, {
      calcType,
      groupSplit: calcType === 'grouped' ? row.groupSplit || Math.ceil(row.boxNames.length / 2) : 0,
    });
  }

  function openBoxEditor(index: number, boxIndex: number) {
    setBoxEditor({ index, boxIndex });
  }

  function closeBoxEditor() {
    setBoxEditor(null);
  }

  function setVisibleToEveryone(index: number) {
    updateRow(index, { visibleTo: [] });
  }

  // Switches into "only selected" mode. Everyone starts checked (visible) so nothing
  // changes until the admin unchecks specific accounts to hide it from them.
  function restrictVisibility(index: number) {
    updateRow(index, { visibleTo: allAccounts.map((account) => account._id) });
  }

  // Called from a checkbox meaning "this account can see the field" — toggles its
  // membership in visibleTo accordingly.
  function toggleAccountVisible(index: number, accountId: string) {
    const row = rows[index];
    const canSee = row.visibleTo.includes(accountId);
    updateRow(index, {
      visibleTo: canSee ? row.visibleTo.filter((id) => id !== accountId) : [...row.visibleTo, accountId],
    });
  }

  async function save() {
    if (finalTotalSaveStatus === 'saving') return;
    setSaving(true);
    const saved: FieldRow[] = [...rows];
    let finalTotalSaved = false;
    try {
      setFinalTotalSaveStatus('saving');
      const finalTotalResult = await api.updateFinalTotalSettings({
        label: finalTotalLabel.trim() || 'Final Total',
        icon: finalTotalIcon,
        sign: finalTotalSign,
      });
      setFinalTotalLabelState(finalTotalResult.label);
      setFinalTotalIconState(finalTotalResult.icon);
      setFinalTotalSignState(finalTotalResult.sign);
      setFinalTotalSaveStatus('saved');
      finalTotalSaved = true;

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const payload = {
          name: row.name.trim() || `Field ${index + 1}`,
          order: index,
          boxNames: row.boxNames.map((boxName, i) => boxName.trim() || `Box ${i + 1}`),
          calcType: row.calcType,
          groupSplit: row.groupSplit,
          icon: row.icon,
          color: row.color,
          boxIcons: row.boxIcons,
          boxColors: row.boxColors,
          boxFields: row.boxFields,
          userOnlyEdit: row.userOnlyEdit,
          visibleTo: row.visibleTo,
        };
        const result = row._id ? await api.updateField(row._id, payload) : await api.createField(payload);
        saved[index] = {
          _id: result._id,
          name: result.name,
          icon: result.icon || '',
          color: result.color || '',
          boxNames: result.boxNames,
          boxIcons: result.boxNames.map((_: string, i: number) => result.boxIcons?.[i] || ''),
          boxColors: result.boxNames.map((_: string, i: number) => result.boxColors?.[i] || ''),
          boxFields: result.boxNames.map((_: string, i: number) => result.boxFields?.[i]?.length ? result.boxFields[i] : SIMPLE_BOX_FIELDS),
          calcType: result.calcType,
          groupSplit: result.groupSplit,
          userOnlyEdit: Boolean(result.userOnlyEdit),
          visibleTo: Array.isArray(result.visibleTo) ? result.visibleTo : [],
        };
      }
      setRows(saved);
    } catch {
      if (!finalTotalSaved) setFinalTotalSaveStatus('error');
      // Persist whichever fields already saved successfully so retrying doesn't recreate them.
      setRows(saved);
      // The API client shows the error notification.
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-4">
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-blue-100 bg-white px-8 py-10 text-center shadow-[0_24px_60px_-24px_rgba(0,107,196,0.38)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-blue-400" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-cyan-100/60 blur-3xl" />

          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-[0_8px_20px_rgba(0,107,196,0.32)]">
              <FiRefreshCw className="animate-spin" size={18} aria-hidden="true" />
            </span>
          </div>

          <div className="relative" role="status" aria-live="polite">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600">Admin settings</p>
            <h1 className="mt-2 font-display text-xl font-extrabold text-blue-950">Loading fields</h1>
            <p className="mt-2 text-xs font-semibold text-slate-500">Preparing your field configuration...</p>
          </div>

          <div className="relative mx-auto mt-6 h-1.5 max-w-44 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400" />
          </div>
        </div>
      </div>
    );
  }

  const indexedRows = rows.map((row, index) => ({ row, index }));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-6 text-white shadow-[0_24px_60px_rgba(0,107,196,0.30)] sm:p-8">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-blue-950/45 to-transparent" />
          <div className="absolute -left-10 -top-12 h-[220%] w-1/2 rotate-12 bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent" />
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">Admin settings</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:text-4xl">Fields</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,20,60,0.18),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                >
                  <FiPlus /> Add field
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || finalTotalSaveStatus === 'saving'}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-blue-800 shadow-[0_10px_24px_rgba(0,20,60,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-[0_14px_30px_rgba(0,20,60,0.34)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving ? <FiRefreshCw className="relative z-10 animate-spin" /> : <FiCheck className="relative z-10" />}
                  <span className="relative z-10">{saving ? 'Saving...' : 'Save changes'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {!canEdit && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-3 text-xs font-medium text-blue-950">
          You can view fields but only a super admin can make changes.
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/35 to-cyan-50/55 p-5 shadow-[0_16px_44px_rgba(0,107,196,0.09)] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-blue-100/60 blur-3xl" aria-hidden="true" />
        <div className="mb-3 flex min-h-5 items-center justify-between gap-3">
          <p className="relative text-xs font-extrabold uppercase tracking-[0.16em] text-blue-950">Final Total card</p>
          <span className="flex items-center gap-1.5 text-xs font-semibold" aria-live="polite" aria-atomic="true">
            {finalTotalSaveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-blue-700">
                <FiRefreshCw className="animate-spin" aria-hidden="true" /> Saving...
              </span>
            )}
            {finalTotalSaveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <FiCheck aria-hidden="true" /> Saved
              </span>
            )}
            {finalTotalSaveStatus === 'error' && <span className="text-red-700">Not saved</span>}
          </span>
        </div>
        <div className="relative flex flex-wrap items-center gap-3">
          <IconPicker value={finalTotalIcon} onChange={setFinalTotalIconState} disabled={!canEdit} />
          <input
            aria-label="Final Total label"
            value={finalTotalLabel}
            readOnly={!canEdit}
            onChange={(event) => setFinalTotalLabelState(event.target.value)}
            className={`min-w-[200px] flex-1 rounded-xl border border-blue-100 px-3.5 py-2.5 text-sm font-bold text-blue-950 shadow-sm outline-none transition ${canEdit ? 'bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10' : 'cursor-default bg-transparent'}`}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canEdit || finalTotalSaveStatus === 'saving'}
              onClick={() => selectFinalTotalSign('add')}
              title="Add the field totals"
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${finalTotalSign === 'add' ? 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'} ${canEdit ? '' : 'cursor-default opacity-80'}`}
            >
              Add (+)
            </button>
            <button
              type="button"
              disabled={!canEdit || finalTotalSaveStatus === 'saving'}
              onClick={() => selectFinalTotalSign('subtract')}
              title="Subtract each following field total from the first"
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${finalTotalSign === 'subtract' ? 'border-red-500 bg-red-600 text-white hover:bg-red-700' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'} ${canEdit ? '' : 'cursor-default opacity-80'}`}
            >
              Subtract (−)
            </button>
          </div>
        </div>
      </section>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          No fields yet.{canEdit ? ' Add one so users have somewhere to enter data.' : ''}
        </div>
      )}

      {indexedRows.map(({ row, index }) => {
        // A field's color is a decorative accent (the stripe below) only — it never
        // recolors the IconPicker/FieldIcon glyph, which always keeps its own fixed color.
        const fieldAccentHex = boxColorHex(row.color);
        return (
        <section key={row._id || `new-${index}`} className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/45 p-4 shadow-[0_16px_44px_rgba(7,39,71,0.08)] transition-shadow hover:shadow-[0_20px_52px_rgba(7,39,71,0.11)] sm:p-6">
          {fieldAccentHex && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ backgroundColor: fieldAccentHex }} />
          )}
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">Field {String(index + 1).padStart(2, '0')}</p>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
              {row.boxNames.length} {row.boxNames.length === 1 ? 'box' : 'boxes'}
            </span>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <IconPicker value={row.icon} onChange={(icon) => updateRow(index, { icon })} disabled={!canEdit} />
            <ColorPicker value={row.color} onChange={(color) => updateRow(index, { color })} disabled={!canEdit} />
            <input
              aria-label="Field name"
              value={row.name}
              readOnly={!canEdit}
              onChange={(event) => updateRow(index, { name: event.target.value })}
              className={`min-w-[12rem] flex-1 rounded-xl border border-blue-100 px-3.5 py-2.5 text-sm font-bold text-blue-950 outline-none transition ${canEdit ? 'bg-blue-50/40 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10' : 'cursor-default bg-transparent'}`}
            />
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded-lg p-2 text-black hover:bg-blue-50 hover:text-blue-800 disabled:opacity-30">
                  <FiChevronUp size={15} />
                </button>
                <button type="button" onClick={() => moveField(index, 1)} disabled={index === rows.length - 1} aria-label="Move down" className="rounded-lg p-2 text-black hover:bg-blue-50 hover:text-blue-800 disabled:opacity-30">
                  <FiChevronDown size={15} />
                </button>
                <button type="button" onClick={() => removeField(index)} aria-label="Remove field" className="rounded-lg p-2 text-black hover:bg-red-50 hover:text-red-600">
                  <FiTrash2 size={15} />
                </button>
              </div>
            )}
          </div>

          <div className="mb-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {row.boxNames.map((boxName, boxIndex) => (
              <BoxTile
                key={boxIndex}
                icon={row.boxIcons[boxIndex]}
                color={row.boxColors[boxIndex]}
                name={boxName}
                boxIndex={boxIndex}
                columnCount={(row.boxFields[boxIndex] || SIMPLE_BOX_FIELDS).length}
                onClick={() => openBoxEditor(index, boxIndex)}
              />
            ))}
          </div>

          {canEdit && (
            <button type="button" onClick={() => addBox(index)} className="mb-5 flex items-center gap-1.5 rounded-xl border border-dashed border-blue-200 bg-white px-3.5 py-2 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50">
              <FiPlus /> Add box
            </button>
          )}

          <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-blue-100 bg-blue-50/35 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black">Calculation (how box values combine into this field's total)</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => canEdit && setCalcType(index, 'grouped')}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition ${row.calcType === 'grouped' ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'} ${canEdit ? '' : 'cursor-default opacity-80'}`}
                >
                  Grouped (split total)
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => canEdit && setCalcType(index, 'signed')}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition ${row.calcType === 'signed' ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'} ${canEdit ? '' : 'cursor-default opacity-80'}`}
                >
                  Sum by sign (+ / −)
                </button>
                {row.calcType === 'grouped' && (
                  <label className="ml-2 flex items-center gap-2 text-xs font-medium text-black">
                    Split after box
                    <input
                      type="number"
                      min={1}
                      max={row.boxNames.length - 1}
                      value={row.groupSplit}
                      readOnly={!canEdit}
                      onChange={(event) => {
                        if (!canEdit) return;
                        const max = Math.max(1, row.boxNames.length - 1);
                        const raw = Number(event.target.value) || 1;
                        updateRow(index, { groupSplit: Math.min(Math.max(1, raw), max) });
                      }}
                      className={`w-16 rounded-lg border border-blue-100 px-2 py-1.5 text-center text-sm text-blue-950 outline-none ${canEdit ? 'bg-blue-50/50 focus:border-blue-400' : 'bg-transparent cursor-default'}`}
                    />
                    <span className="text-black">of {row.boxNames.length}</span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black lg:text-right">Work assignment</p>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && updateRow(index, { userOnlyEdit: !row.userOnlyEdit })}
                title="Choose whether the Admin or assigned User enters this field's values"
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition disabled:cursor-default disabled:opacity-60 ${
                  row.userOnlyEdit ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'
                }`}
              >
                <FiLock size={14} />
                {row.userOnlyEdit ? 'User work (Admin view only)' : 'Admin work (User view only)'}
              </button>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black lg:text-right">Visibility</p>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setVisibilityEditor(index)}
                title="Choose which users or admins can see this field"
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition disabled:cursor-default disabled:opacity-60 ${
                  row.visibleTo.length > 0 ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'
                }`}
              >
                {row.visibleTo.length > 0 ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                {row.visibleTo.length > 0 ? `Visible to ${row.visibleTo.length} selected` : 'Visible to everyone'}
              </button>
            </div>
          </div>
        </section>
        );
      })}

      {canEdit && confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="fields-confirm-title">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white p-6 text-center shadow-[0_30px_80px_rgba(0,20,60,0.35)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-400 via-red-600 to-rose-500" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiTrash2 size={25} />
            </div>
            <h2 id="fields-confirm-title" className="font-display text-2xl font-extrabold text-blue-950">
              Remove field?
            </h2>
            <p className="mt-2 text-sm text-black">
              {`"${confirmDelete.name}" will be permanently removed.`}
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={cancelRemoveField} className="flex-1 rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                Cancel
              </button>
              <button onClick={confirmRemoveField} className="flex-1 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {boxEditor && rows[boxEditor.index] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/55 p-3 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="box-editor-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeBoxEditor();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,20,60,0.42)]">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-950 to-blue-700 px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                  {rows[boxEditor.index].name || 'Field'}
                </p>
                <h2 id="box-editor-title" className="font-display text-xl font-extrabold text-white">
                  {rows[boxEditor.index].boxNames[boxEditor.boxIndex] || `Box ${boxEditor.boxIndex + 1}`}
                </h2>
              </div>
              <button type="button" onClick={closeBoxEditor} aria-label="Close" className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <FiX size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <BoxEditor
                canEdit={canEdit}
                boxIndex={boxEditor.boxIndex}
                boxName={rows[boxEditor.index].boxNames[boxEditor.boxIndex]}
                boxIcon={rows[boxEditor.index].boxIcons[boxEditor.boxIndex]}
                boxColor={rows[boxEditor.index].boxColors[boxEditor.boxIndex]}
                boxFields={rows[boxEditor.index].boxFields[boxEditor.boxIndex] || SIMPLE_BOX_FIELDS}
                canRemove={rows[boxEditor.index].boxNames.length > 1}
                onIconChange={(icon) => updateBoxIcon(boxEditor.index, boxEditor.boxIndex, icon)}
                onColorChange={(color) => updateBoxColor(boxEditor.index, boxEditor.boxIndex, color)}
                onNameChange={(value) => updateBoxName(boxEditor.index, boxEditor.boxIndex, value)}
                onFieldsChange={(fields) => updateBoxFields(boxEditor.index, boxEditor.boxIndex, fields)}
                onRemove={() => {
                  removeBox(boxEditor.index, boxEditor.boxIndex);
                  closeBoxEditor();
                }}
              />
            </div>

            <div className="flex gap-3 border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              <button type="button" onClick={closeBoxEditor} className="flex-1 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-800 hover:to-blue-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {canEdit && visibilityEditor !== null && rows[visibilityEditor] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/55 p-3 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visibility-editor-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setVisibilityEditor(null);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,20,60,0.42)]">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-950 to-blue-700 px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Visibility</p>
                <h2 id="visibility-editor-title" className="font-display text-xl font-extrabold text-white">
                  {rows[visibilityEditor].name || 'Field'}
                </h2>
              </div>
              <button type="button" onClick={() => setVisibilityEditor(null)} aria-label="Close" className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <p className="text-xs text-black">
                Choose which users or admins can see this field on their entry and reports pages. Super Admin always sees every field.
              </p>

              <button
                type="button"
                onClick={() => setVisibleToEveryone(visibilityEditor)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  rows[visibilityEditor].visibleTo.length === 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-blue-100 bg-white text-blue-800 hover:bg-blue-50'
                }`}
              >
                <span className="flex items-center gap-2"><FiEye size={15} /> Visible to everyone</span>
                {rows[visibilityEditor].visibleTo.length === 0 && <FiCheck size={15} />}
              </button>

              <button
                type="button"
                onClick={() => restrictVisibility(visibilityEditor)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  rows[visibilityEditor].visibleTo.length > 0 ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-blue-100 bg-white text-blue-800 hover:bg-blue-50'
                }`}
              >
                <span className="flex items-center gap-2"><FiEyeOff size={15} /> Only selected users/admins</span>
                {rows[visibilityEditor].visibleTo.length > 0 && <FiCheck size={15} />}
              </button>

              {rows[visibilityEditor].visibleTo.length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black">
                    Checked accounts can see this field
                  </p>
                  {allAccounts.length === 0 && (
                    <p className="text-xs text-black">No users or admins found yet.</p>
                  )}
                  {(['admin', 'user'] as const).map((roleKey) => {
                    const group = allAccounts.filter((account) => account.role === roleKey);
                    if (group.length === 0) return null;
                    return (
                      <div key={roleKey} className="mb-3 last:mb-0">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black">
                          {roleKey === 'admin' ? 'Admins' : 'Users'}
                        </p>
                        <div className="space-y-1">
                          {group.map((account) => (
                            <label key={account._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-blue-900 hover:bg-white">
                              <input
                                type="checkbox"
                                checked={rows[visibilityEditor].visibleTo.includes(account._id)}
                                onChange={() => toggleAccountVisible(visibilityEditor, account._id)}
                                className="h-3.5 w-3.5 rounded border-blue-300 text-blue-900 focus:ring-blue-500"
                              />
                              <span className="min-w-0 flex-1 truncate">
                                <span className="font-medium">{account.name}</span>
                                <span className="ml-1 text-black">{account.email}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              <button type="button" onClick={() => setVisibilityEditor(null)} className="flex-1 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-800 hover:to-blue-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BoxTile({
  icon,
  color,
  name,
  boxIndex,
  columnCount,
  onClick,
}: {
  icon: string;
  color: string;
  name: string;
  boxIndex: number;
  columnCount: number;
  onClick: () => void;
}) {
  const hex = boxColorHex(color);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${name || `Box ${boxIndex + 1}`}, click to edit`}
      className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/75 p-3 text-left shadow-[0_5px_14px_rgba(7,39,71,0.05)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_12px_26px_rgba(0,107,196,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15"
    >
      {/* The icon badge always keeps its default blue color — box color (hex) is used
          for the little dot below only, never to tint the icon itself. */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-transform group-hover:scale-105">
        <FieldIcon icon={icon} size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-extrabold text-blue-950">{name || `Box ${boxIndex + 1}`}</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {columnCount} column{columnCount === 1 ? '' : 's'}
        </span>
      </span>
      {hex && <span className="h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: hex }} />}
    </button>
  );
}

function isSimpleBoxFields(fields: BoxFieldDef[]) {
  if (fields.length !== 2) return false;
  const [a, b] = fields;
  return (
    a.label.trim().toLowerCase() === 'name' && a.type === 'text' && !a.auto && !a.sumTotal &&
    b.label.trim().toLowerCase() === 'value' && b.type === 'number' && !b.auto
  );
}

function BoxEditor({
  canEdit,
  boxIndex,
  boxName,
  boxIcon,
  boxColor,
  boxFields,
  canRemove,
  onIconChange,
  onColorChange,
  onNameChange,
  onFieldsChange,
  onRemove,
}: {
  canEdit: boolean;
  boxIndex: number;
  boxName: string;
  boxIcon: string;
  boxColor: string;
  boxFields: BoxFieldDef[];
  canRemove: boolean;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  onNameChange: (value: string) => void;
  onFieldsChange: (fields: BoxFieldDef[]) => void;
  onRemove: () => void;
}) {
  const simple = isSimpleBoxFields(boxFields);

  function updateColumn(colIndex: number, changes: Partial<BoxFieldDef>) {
    onFieldsChange(boxFields.map((col, i) => (i === colIndex ? { ...col, ...changes } : col)));
  }

  function addColumn() {
    onFieldsChange([...boxFields, { label: `Column ${boxFields.length + 1}`, type: 'text' }]);
  }

  function removeColumn(colIndex: number) {
    const next = boxFields.filter((_, i) => i !== colIndex);
    onFieldsChange(next.length ? next : SIMPLE_BOX_FIELDS);
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
      <div className="flex items-end gap-1.5">
        <IconPicker size="sm" value={boxIcon} onChange={onIconChange} disabled={!canEdit} />
        <ColorPicker size="sm" value={boxColor} onChange={onColorChange} disabled={!canEdit} />
        <label className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-black">
          Box {boxIndex + 1}
          <input
            value={boxName}
            readOnly={!canEdit}
            onChange={(event) => onNameChange(event.target.value)}
            className={`mt-1 w-full rounded-lg border border-blue-100 px-3 py-2 text-sm normal-case tracking-normal text-blue-950 outline-none ${canEdit ? 'bg-blue-50/50 focus:border-blue-400' : 'bg-transparent cursor-default'}`}
          />
        </label>
        {canEdit && (
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Remove box"
            className="mt-4 rounded-lg p-2 text-black hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 border-t border-blue-100 pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-black">Inner table columns</p>
          {canEdit && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onFieldsChange(TEAM_BOX_FIELDS)}
                className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-950 hover:bg-blue-50"
              >
                Use Team Box template
              </button>
              <button
                type="button"
                onClick={() => onFieldsChange(CURRENCY_BOX_FIELDS)}
                className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-950 hover:bg-blue-50"
              >
                Use Currency Conversion template
              </button>
              <button
                type="button"
                onClick={() => onFieldsChange(CRYPTO_BOX_FIELDS)}
                className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-950 hover:bg-blue-50"
              >
                Use Crypto template
              </button>
              {!simple && (
                <button
                  type="button"
                  onClick={() => onFieldsChange(SIMPLE_BOX_FIELDS)}
                  className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-950 hover:bg-blue-50"
                >
                  Reset to simple
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          {boxFields.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-wrap items-center gap-1.5">
              <input
                value={col.label}
                readOnly={!canEdit}
                onChange={(event) => updateColumn(colIndex, { label: event.target.value })}
                placeholder="Column label"
                className={`min-w-0 flex-1 rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs text-blue-950 outline-none ${canEdit ? 'bg-white focus:border-blue-400' : 'bg-transparent cursor-default'}`}
              />
              <select
                value={col.type}
                disabled={!canEdit}
                onChange={(event) => {
                  const type = event.target.value as BoxFieldDef['type'];
                  updateColumn(colIndex, {
                    type,
                    sumTotal: type === 'number' || type === 'computed' ? col.sumTotal : undefined,
                    sumSign: type === 'number' || type === 'computed' ? col.sumSign : undefined,
                    auto: type === 'computed' ? undefined : type === 'number' ? col.auto : col.auto === 'constant' ? undefined : col.auto,
                    constant: type === 'number' && col.auto === 'constant' ? col.constant : undefined,
                    formula: type === 'computed' ? (col.formula || { op: 'multiply', a: '', b: '' }) : undefined,
                  });
                }}
                className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="computed">Computed</option>
              </select>
              {col.type !== 'computed' && (
                <select
                  value={col.auto || ''}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const auto = (event.target.value || undefined) as BoxFieldDef['auto'];
                    updateColumn(colIndex, { auto, constant: auto === 'constant' ? (col.constant ?? 0) : undefined });
                  }}
                  className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                >
                  <option value="">No auto-fill</option>
                  <option value="serial">Row number</option>
                  <option value="user">Current user</option>
                  {col.type === 'number' && <option value="constant">Fixed value (superadmin)</option>}
                </select>
              )}
              {col.type === 'number' && col.auto === 'constant' && (
                <label className="flex items-center gap-1 text-[10px] font-medium text-black">
                  Fixed at
                  <input
                    type="number"
                    value={col.constant ?? 0}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { constant: Number(event.target.value) || 0 })}
                    className="w-16 rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  />
                </label>
              )}
              {(col.type === 'number' || col.type === 'computed') && (
                <label className="flex items-center gap-1 text-[10px] font-medium text-black">
                  <input
                    type="checkbox"
                    checked={Boolean(col.sumTotal)}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { sumTotal: event.target.checked, sumSign: event.target.checked ? col.sumSign : undefined })}
                    className="h-3.5 w-3.5 rounded border-blue-300 text-blue-900 focus:ring-blue-500"
                  />
                  Total
                </label>
              )}
              {(col.type === 'number' || col.type === 'computed') && col.sumTotal && (
                <select
                  value={col.sumSign === 'subtract' ? 'subtract' : 'add'}
                  disabled={!canEdit}
                  onChange={(event) => updateColumn(colIndex, { sumSign: event.target.value === 'subtract' ? 'subtract' : undefined })}
                  className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                >
                  <option value="add">Add (+)</option>
                  <option value="subtract">Subtract (−)</option>
                </select>
              )}
              {col.type === 'computed' && (
                <div className="flex basis-full flex-wrap items-center gap-1.5 pl-1">
                  <select
                    value={col.formula?.op || 'multiply'}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { formula: { op: event.target.value as 'multiply' | 'percentAdd', a: col.formula?.a || '', b: col.formula?.b || '' } })}
                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  >
                    <option value="multiply">A x B (e.g. Hours x Rate = Pay)</option>
                    <option value="percentAdd">A + A x B% (e.g. INR + Bonus% = Value)</option>
                  </select>
                  <select
                    value={col.formula?.a || ''}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { formula: { op: col.formula?.op || 'multiply', a: event.target.value, b: col.formula?.b || '' } })}
                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  >
                    <option value="">A: choose column</option>
                    {boxFields.filter((f, i) => i !== colIndex && f.label.trim()).map((f) => (
                      <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={col.formula?.b || ''}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { formula: { op: col.formula?.op || 'multiply', a: col.formula?.a || '', b: event.target.value } })}
                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  >
                    <option value="">B: choose column</option>
                    {boxFields.filter((f, i) => i !== colIndex && f.label.trim()).map((f) => (
                      <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => removeColumn(colIndex)}
                  disabled={boxFields.length <= 1}
                  aria-label="Remove column"
                  className="rounded-lg p-1.5 text-black hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <FiTrash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <button type="button" onClick={addColumn} className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-950 hover:underline">
            <FiPlus size={12} /> Add column
          </button>
        )}
      </div>
    </div>
  );
}
