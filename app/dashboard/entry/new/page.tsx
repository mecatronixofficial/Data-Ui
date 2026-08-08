'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiRefreshCw, FiUser, FiX } from 'react-icons/fi';
import { type BoxDetail } from '@/components/TallyBox';
import { type Operator } from '@/components/OperatorToggle';
import DynamicFieldsForm, { FinalTotalCard, type FieldValue } from '@/components/DynamicFieldsForm';
import { api, blankBoxDetail, computeFieldLocked, type BoxFieldDef, type FinalTotalSign } from '@/lib/api';
import { toast } from '@/lib/toast';

type FieldConfig = {
  name: string;
  icon?: string;
  // Decorative accent only — never applied to the field icon's own color.
  color?: string;
  boxNames: string[];
  boxIcons?: string[];
  boxColors?: string[];
  boxFields?: BoxFieldDef[][];
  calcType: 'grouped' | 'signed';
  groupSplit: number;
  locked?: boolean;
};

function todayInputValue() {
  const today = new Date();
  const localTime = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

function dateInputValue(value: unknown) {
  const match = typeof value === 'string' ? value.match(/^\d{4}-\d{2}-\d{2}/) : null;
  return match?.[0] || todayInputValue();
}

function savedEntryTimestamp(entry: any) {
  const value = entry?.updatedAt || entry?.createdAt;
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? '' : timestamp.toISOString();
}

function FlipClockPanel({ value, label, wide = false }: { value: string; label: string; wide?: boolean }) {
  return (
    <span className="flex flex-col items-center">
      <span className={`relative flex h-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-blue-700 via-blue-800 to-blue-950 shadow-[0_6px_14px_rgba(7,39,71,0.35)] ring-1 ring-inset ring-white/10 sm:h-12 ${wide ? 'min-w-[2.4rem] sm:min-w-[2.6rem]' : 'min-w-[1.95rem] sm:min-w-[2.15rem]'}`}>
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/25" />
        <span key={value} className="entry-flip-up relative font-mono text-lg font-bold leading-none tracking-wide text-white sm:text-xl">
          {value}
        </span>
      </span>
      <span className="text-[5px] mt-[3px] font-semibold uppercase tracking-[0.12em] text-blue-700">{label}</span>
    </span>
  );
}

// Keep the one-second clock state below this component boundary. Previously the
// whole entry form re-rendered every second, which was especially expensive when
// fields contained large detail tables.
function CurrentFlipClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = String(now.getHours() % 12 || 12).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const period = now.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <div className="flex h-auto items-center gap-1 rounded-lg" aria-label={`Current time ${hour}:${minute} ${period}`}>
      <FlipClockPanel value={hour} label="Hour" />
      <span className="-mt-1 font-mono text-sm font-bold text-blue-800" aria-hidden="true">:</span>
      <FlipClockPanel value={minute} label="Minute" />
      <FlipClockPanel value={period} label="Period" wide />
    </div>
  );
}

function normalizeOperator(value: unknown): Operator {
  return value === '-' ? '-' : '+';
}

function fieldConfigFromApi(raw: any, index: number, role: string): FieldConfig {
  if (!raw || !Array.isArray(raw.boxNames) || raw.boxNames.length === 0) {
    throw new Error(`Field ${index + 1} has an invalid box configuration.`);
  }

  const boxNames: string[] = raw.boxNames.map((name: unknown, boxIndex: number) =>
    typeof name === 'string' && name.trim() ? name : `Box ${boxIndex + 1}`,
  );

  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : `Field ${index + 1}`,
    icon: typeof raw.icon === 'string' ? raw.icon : '',
    color: typeof raw.color === 'string' ? raw.color : '',
    boxNames,
    boxIcons: Array.isArray(raw.boxIcons) ? boxNames.map((_, i) => raw.boxIcons[i] || '') : undefined,
    boxColors: Array.isArray(raw.boxColors) ? boxNames.map((_, i) => raw.boxColors[i] || '') : undefined,
    boxFields: Array.isArray(raw.boxFields)
      ? boxNames.map((_, i) => (Array.isArray(raw.boxFields[i]) ? raw.boxFields[i] : []))
      : undefined,
    calcType: raw.calcType === 'grouped' ? 'grouped' : 'signed',
    groupSplit: Number.isInteger(raw.groupSplit) ? raw.groupSplit : 0,
    locked: computeFieldLocked(role, Boolean(raw.userOnlyEdit)),
  };
}

function blankField(config: FieldConfig): FieldValue {
  return {
    name: config.name,
    icon: config.icon,
    color: config.color,
    boxNames: [...config.boxNames],
    boxIcons: config.boxIcons ? [...config.boxIcons] : undefined,
    boxColors: config.boxColors ? [...config.boxColors] : undefined,
    boxFields: config.boxFields ? [...config.boxFields] : undefined,
    boxes: Array(config.boxNames.length).fill(0),
    details: config.boxNames.map(() => []),
    calcType: config.calcType,
    groupSplit: config.groupSplit,
    operator: '+',
    locked: config.locked,
  };
}

function fieldFromSaved(config: FieldConfig, saved: any): FieldValue {
  const savedBoxes = Array.isArray(saved?.boxes) ? saved.boxes : [];
  const savedDetails = Array.isArray(saved?.details) ? saved.details : [];
  const boxes = config.boxNames.map((_, index) => Number(savedBoxes[index]) || 0);
  return {
    name: config.name,
    icon: config.icon,
    color: config.color,
    boxNames: [...config.boxNames],
    boxIcons: config.boxIcons ? [...config.boxIcons] : undefined,
    boxColors: config.boxColors ? [...config.boxColors] : undefined,
    boxFields: config.boxFields ? [...config.boxFields] : undefined,
    boxes,
    details: config.boxNames.map((_, index) =>
      Array.isArray(savedDetails[index]) && savedDetails[index].length
        ? savedDetails[index]
        : savedBoxes[index] !== undefined
          ? [blankBoxDetail(boxes[index])]
          : [],
    ),
    calcType: config.calcType,
    groupSplit: config.groupSplit,
    operator: normalizeOperator(saved?.operator),
    locked: config.locked,
  };
}

function fieldsFromSavedEntry(configs: FieldConfig[], entry: any) {
  const savedFields = Array.isArray(entry?.fields) ? entry.fields : [];
  const savedByName = new Map(savedFields.map((field: any) => [field?.name, field]));
  return configs.map((config) => {
    const saved = savedByName.get(config.name);
    return saved ? fieldFromSaved(config, saved) : blankField(config);
  });
}

export default function NewEntryPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const editingId = params?.id;
  const isEditing = Boolean(editingId);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const [date, setDate] = useState(todayInputValue);
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');

  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [fields, setFields] = useState<FieldValue[]>([]);
  const [finalTotalLabel, setFinalTotalLabel] = useState('Final Total');
  const [finalTotalIcon, setFinalTotalIcon] = useState('');
  const [finalTotalSign, setFinalTotalSign] = useState<FinalTotalSign>('add');
  // One canonical report per team. The admin and every assigned user load and
  // update this same id; role locks decide which fields each person may change.
  const [myEntryId, setMyEntryId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const lastRemoteVersion = useRef('');
  const changedBoxes = useRef<Map<string, Set<number>>>(new Map());
  const dateChanged = useRef(false);

  function clearLocalChanges() {
    changedBoxes.current.clear();
    dateChanged.current = false;
  }

  function markBoxChanged(fieldName: string, boxIndex: number) {
    const indexes = changedBoxes.current.get(fieldName) || new Set<number>();
    indexes.add(boxIndex);
    changedBoxes.current.set(fieldName, indexes);
  }

  useEffect(() => {
    if (editingId) return;
    setLoadingEntry(true);
    setLoadError('');
    api.getEntryWorkspace()
      .then((workspace) => {
        const user = workspace?.viewer || {};
        const myFields = workspace?.fields;
        const activeEntry = workspace?.activeEntry;
        if (user.role === 'superadmin') {
          router.replace('/dashboard');
          return;
        }
        if (!Array.isArray(myFields)) {
          throw new Error('The fields service returned an invalid response. Restart or redeploy the backend.');
        }
        const configs: FieldConfig[] = myFields.map((field: any, index: number) =>
          fieldConfigFromApi(field, index, user.role),
        );
        setFieldConfigs(configs);
        setDefaultName(user.name);
        setRole(user.role || '');
        const teamReportName = typeof user.teamName === 'string' && user.teamName.trim()
          ? user.teamName
          : user.name;

        const existing = activeEntry;
        if (existing) {
          setMyEntryId(typeof existing._id === 'string' ? existing._id : null);
          setName(typeof existing.name === 'string' && existing.name.trim() ? existing.name : teamReportName);
          const today = todayInputValue();
          setDate(today);
          dateChanged.current = dateInputValue(existing.date) !== today;
          setFields(fieldsFromSavedEntry(configs, existing));
          setLastUpdatedAt(savedEntryTimestamp(existing));
          lastRemoteVersion.current = String(existing.updatedAt || existing.__v || '');
        } else {
          setName(teamReportName);
          setFields(configs.map(blankField));
          setLastUpdatedAt('');
          dateChanged.current = false;
        }
        const totalSettings = workspace?.finalTotalSettings;
        if (totalSettings) {
          setFinalTotalLabel(totalSettings.label);
          setFinalTotalIcon(totalSettings.icon);
          setFinalTotalSign(totalSettings.sign);
        }
        changedBoxes.current.clear();
        setDirty(false);
      })
      .catch((err: any) => {
        if (err?.status === 401) {
          router.replace('/login');
          return;
        }
        setLoadError(err?.message || 'Could not load the entry page');
      })
      .finally(() => setLoadingEntry(false));
  }, [editingId, router, reloadToken]);

  useEffect(() => {
    if (!editingId) return;
    setLoadingEntry(true);
    setLoadError('');
    Promise.all([
      api.getEntry(editingId),
      api.getEntryWorkspace(),
    ])
      .then(([entry, workspace]) => {
        const user = workspace?.viewer || {};
        if (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'user') {
          router.replace('/dashboard');
          return;
        }
        setDefaultName(user.name);
        setRole(user.role || '');
        const configuredFields = workspace?.fields;
        if (!Array.isArray(entry.fields)) {
          throw new Error('This saved entry has invalid field data.');
        }
        if (!Array.isArray(configuredFields)) {
          throw new Error('The fields service returned an invalid response.');
        }
        setName(typeof entry.name === 'string' ? entry.name : '');
        setDate(dateInputValue(entry.date));
        const configs = configuredFields.map((field: any, index: number) =>
          fieldConfigFromApi(field, index, user.role),
        );
        setFieldConfigs(configs);
        setFields(fieldsFromSavedEntry(configs, entry));
        setMyEntryId(typeof entry._id === 'string' ? entry._id : editingId);
        setLastUpdatedAt(savedEntryTimestamp(entry));
        lastRemoteVersion.current = String(entry.updatedAt || entry.__v || '');
        const totalSettings = workspace?.finalTotalSettings;
        if (totalSettings) {
          setFinalTotalLabel(totalSettings.label);
          setFinalTotalIcon(totalSettings.icon);
          setFinalTotalSign(totalSettings.sign);
        }
        changedBoxes.current.clear();
        dateChanged.current = false;
        setDirty(false);
      })
      .catch((err: any) => setLoadError(err.message || 'Could not load entry'))
      .finally(() => setLoadingEntry(false));
  }, [editingId, router, reloadToken]);

  const sharedEntryId = editingId || myEntryId;

  useEffect(() => {
    if (!sharedEntryId || loadingEntry || dirty || saving) return;
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const version = await api.getEntryVersion(sharedEntryId);
        const remoteVersion = String(version?.updatedAt || version?.__v || '');
        if (remoteVersion && remoteVersion === lastRemoteVersion.current) return;
        const entry = await api.getEntry(sharedEntryId);
        setName((currentName) =>
          typeof entry.name === 'string' ? entry.name : currentName,
        );
        if (editingId) setDate(dateInputValue(entry.date));
        setFields(fieldsFromSavedEntry(fieldConfigs, entry));
        setLastUpdatedAt(savedEntryTimestamp(entry));
        lastRemoteVersion.current = remoteVersion;
        setSyncVersion((version) => version + 1);
      } catch {
        // A transient refresh failure must not interrupt local work. Explicit
        // loads and saves still surface actionable errors to the user.
      }
    };
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [sharedEntryId, loadingEntry, dirty, saving, fieldConfigs, editingId]);

  function updateBox(fieldIndex: number, boxIndex: number, value: number) {
    setDirty(true);
    setFields((prev) => {
      if (!prev[fieldIndex] || boxIndex < 0 || boxIndex >= prev[fieldIndex].boxes.length) return prev;
      markBoxChanged(prev[fieldIndex].name, boxIndex);
      const next = [...prev];
      const boxes = [...next[fieldIndex].boxes];
      boxes[boxIndex] = value;
      next[fieldIndex] = { ...next[fieldIndex], boxes };
      return next;
    });
  }

  function updateDetails(fieldIndex: number, boxIndex: number, details: BoxDetail[]) {
    setDirty(true);
    setFields((prev) => {
      if (!prev[fieldIndex] || boxIndex < 0 || boxIndex >= prev[fieldIndex].details.length) return prev;
      markBoxChanged(prev[fieldIndex].name, boxIndex);
      const next = [...prev];
      const fieldDetails = [...next[fieldIndex].details];
      fieldDetails[boxIndex] = details;
      next[fieldIndex] = { ...next[fieldIndex], details: fieldDetails };
      return next;
    });
  }

  function resetFieldValues() {
    setDirty(true);
    fieldConfigs.forEach((field) => {
      field.boxNames.forEach((_, boxIndex) => markBoxChanged(field.name, boxIndex));
    });
    setFields(fieldConfigs.map(blankField));
  }

  function resetSingleField(fieldIndex: number) {
    if (!fieldConfigs[fieldIndex]) return;
    setDirty(true);
    fieldConfigs[fieldIndex].boxNames.forEach((_, boxIndex) => {
      markBoxChanged(fieldConfigs[fieldIndex].name, boxIndex);
    });
    setFields((prev) => {
      if (!prev[fieldIndex]) return prev;
      const next = [...prev];
      next[fieldIndex] = blankField(fieldConfigs[fieldIndex]);
      return next;
    });
  }

  function handleCancel() {
    if (!isEditing) {
      window.location.reload();
      return;
    }
    router.push(role === 'admin' ? '/dashboard/reports/team' : role === 'superadmin' ? '/dashboard/reports' : '/dashboard');
  }

  async function handleSave() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      toast.error('Please enter a name before saving.');
      return;
    }
    if (!date) {
      toast.error('Please select a date before saving.');
      return;
    }
    if (fields.length === 0) {
      toast.error('No fields are configured yet. Contact your admin.');
      return;
    }
    setSaving(true);
    try {
      const changedFields = Array.from(changedBoxes.current.entries()).map(([fieldName, boxIndexes]) => ({
        name: fieldName,
        boxIndexes: Array.from(boxIndexes).sort((a, b) => a - b),
      }));
      const payload: any = {
        name: normalizedName,
        date,
        fields: fields.map((field) => ({
          name: field.name,
          boxes: field.boxes,
          details: field.details,
          operator: field.operator,
        })),
        // Include the local change set even on a first-save request. If another
        // device created the team report after this page loaded, the backend can
        // merge these boxes instead of treating this stale page as a full replace.
        changedFields,
        dateChanged: dateChanged.current,
      };
      let savedEntry: any;
      if (editingId) {
        savedEntry = await api.updateEntry(editingId, payload);
        setLastUpdatedAt(savedEntryTimestamp(savedEntry) || new Date().toISOString());
        lastRemoteVersion.current = String(savedEntry?.updatedAt || savedEntry?.__v || '');
        if (Array.isArray(savedEntry?.fields)) {
          setFields(fieldsFromSavedEntry(fieldConfigs, savedEntry));
        }
        clearLocalChanges();
        setDirty(false);
        router.push(role === 'admin' ? '/dashboard/reports/team' : role === 'superadmin' ? '/dashboard/reports' : '/dashboard');
        return;
      }
      if (myEntryId) {
        savedEntry = await api.updateActiveEntry(myEntryId, payload);
      } else {
        try {
          savedEntry = await api.createEntry(payload);
        } catch (createError: any) {
          if (createError?.status !== 409) throw createError;
          // A second tab/request may have created the canonical report after
          // this page loaded. Recover it and save instead of showing a conflict.
          const activeEntry = await api.getActiveEntry();
          if (!activeEntry?._id) throw createError;
          savedEntry = await api.updateActiveEntry(activeEntry._id, payload);
        }
        setMyEntryId(savedEntry._id);
      }
      setLastUpdatedAt(savedEntryTimestamp(savedEntry) || new Date().toISOString());
      lastRemoteVersion.current = String(savedEntry?.updatedAt || savedEntry?.__v || '');
      if (typeof savedEntry?.name === 'string' && savedEntry.name.trim()) {
        setName(savedEntry.name);
      }
      if (Array.isArray(savedEntry?.fields)) {
        setFields(fieldsFromSavedEntry(fieldConfigs, savedEntry));
      }
      clearLocalChanges();
      setDirty(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // The API client shows the error notification.
    } finally {
      setSaving(false);
    }
  }

  if (loadingEntry) {
    return (
      <div className="entry-page flex min-h-[65vh] items-center justify-center">
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white px-12 py-10 text-center shadow-[0_24px_70px_rgba(7,39,71,0.12)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 shadow-[0_12px_30px_rgba(7,39,71,0.25)]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          </div>
          <p className="font-display text-lg font-semibold text-blue-950">Preparing your workspace</p>
          <p className="mt-1 text-xs text-black">Loading fields and saved values...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="entry-page flex min-h-[65vh] items-center justify-center">
        <section role="alert" className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(127,29,29,0.12)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <FiAlertCircle size={24} />
          </span>
          <h1 className="mt-4 font-display text-xl font-semibold text-blue-950">Could not load the entry page</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700/75">{loadError}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FiRefreshCw size={15} /> Retry
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50"
            >
              Dashboard
            </button>
          </div>
        </section>
      </div>
    );
  }

  const selectedDate = date ? new Date(`${date}T00:00:00`) : null;
  const lastUpdatedDateTime = lastUpdatedAt ? new Date(lastUpdatedAt) : null;

  return (
    <div className="entry-page space-y-3 pb-4">
      <header className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-[0_8px_28px_rgba(7,39,71,0.07)] sm:p-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] md:grid-cols-[auto_minmax(14rem,1fr)_auto] md:items-stretch lg:grid-cols-[auto_minmax(14rem,1fr)_auto_auto]">
          <div className="relative order-2 flex h-16 w-full min-w-0 flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-2.5 py-1.5 text-white shadow-[0_10px_22px_rgba(5,150,105,0.30)] ring-1 ring-inset ring-white/15 sm:order-none sm:w-32 sm:min-w-[8rem]">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" aria-hidden="true" />
            <span className="relative flex items-center gap-1.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-50/90">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                <FiRefreshCw size={8} aria-hidden="true" />
              </span>
              Last updated
            </span>
            <span className="relative pl-[1.375rem]">
              {lastUpdatedDateTime ? (
                <span className="mt-0.5 block whitespace-nowrap font-mono font-semibold leading-tight">
                  <span className="block text-xs text-white">
                    {lastUpdatedDateTime.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="mt-0.5 inline-flex rounded bg-white px-1.5 py-0.5 text-[10px] leading-none text-emerald-700 shadow-sm">
                    {lastUpdatedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              ) : (
                <span className="block whitespace-nowrap font-mono text-[9px] font-semibold leading-tight text-emerald-50/90">Not saved yet</span>
              )}
            </span>
          </div>

          <label className="group relative order-1 flex min-h-[4rem] min-w-0 items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/35 px-3 py-2 sm:order-none">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-950">
              <FiUser size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-black">Team report</span>
              <input
                value={name}
                readOnly
                placeholder="Enter a record name"
                className="mt-0.5 w-full cursor-default border-0 bg-transparent p-0 text-sm font-semibold text-blue-950 outline-none placeholder:font-normal placeholder:text-black"
              />
            </span>
          </label>

          <div className="order-3 flex h-14 w-full items-center justify-between gap-1.5 self-stretch sm:col-span-2 sm:h-16 sm:justify-end md:order-none md:col-span-1 md:justify-start">
            <CurrentFlipClock />
            <label className="group relative flex h-12 w-12 min-w-[3.5rem] cursor-pointer flex-col overflow-hidden rounded-lg bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white shadow-[0_10px_22px_rgba(220,38,38,0.30)] ring-1 ring-inset ring-white/15 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(220,38,38,0.40)] focus-within:ring-4 focus-within:ring-red-300/30 sm:h-14 sm:w-14 sm:min-w-[4rem]">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" aria-hidden="true" />
              <span className="pointer-events-none absolute left-3 top-0 z-10 h-2 w-1 -translate-y-1/2 rounded-full bg-white/70 shadow-sm" />
              <span className="pointer-events-none absolute right-3 top-0 z-10 h-2 w-1 -translate-y-1/2 rounded-full bg-white/70 shadow-sm" />
              <span className="relative block bg-black/15 px-2 py-0.5 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white">
                {selectedDate ? selectedDate.toLocaleDateString([], { month: 'short' }) : 'Date'}
              </span>
              <span key={date} className="entry-flip-up relative flex flex-1 flex-col items-center justify-center px-2 py-0.5">
                <span className="font-display text-xl font-bold leading-none text-white">
                  {selectedDate ? selectedDate.toLocaleDateString([], { day: '2-digit' }) : '--'}
                </span>
                <span className="mt-0.5 flex items-center gap-0.5 text-[6px] font-semibold uppercase leading-none text-red-50/90">
                  <span>{selectedDate ? selectedDate.toLocaleDateString([], { weekday: 'short' }) : 'Select'}</span>
                  <span aria-hidden="true">{'\u00B7'}</span>
                  <span>{selectedDate ? selectedDate.getFullYear() : 'date'}</span>
                </span>
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  dateChanged.current = true;
                  setDirty(true);
                }}
                aria-label="Entry date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>

          {fields.length > 0 && (
            <div className="order-4 flex w-full flex-wrap items-center justify-end gap-2 sm:col-span-2 md:order-none md:col-span-3 lg:col-span-1 lg:self-center">
              {role === 'superadmin' && (
                <button
                  type="button"
                  onClick={resetFieldValues}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/30"
                >
                  <FiRefreshCw size={14} /> Reset fields
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                aria-label={isEditing || myEntryId ? (saving ? 'Updating' : 'Update') : (saving ? 'Saving' : 'Save')}
                title={isEditing || myEntryId ? 'Update' : 'Save'}
                className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 text-white shadow-[0_10px_22px_rgba(0,107,196,0.35)] ring-1 ring-inset ring-white/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,107,196,0.45)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" aria-hidden="true" />
                <span className="pointer-events-none absolute -inset-1 rounded-2xl bg-white/0 transition group-hover:bg-white/5" aria-hidden="true" />
                {saving
                  ? <FiRefreshCw className="relative z-10 animate-spin" size={18} />
                  : <FiCheck className="relative z-10 transition-transform duration-200 group-hover:scale-110" size={20} />}
              </button>
            </div>
          )}
        </div>
      </header>
      {fields.length === 0 ? (
        <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-[0_12px_35px_rgba(120,53,15,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FiAlertCircle size={21} />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-amber-950">No fields configured</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-amber-800/70">
            Ask the Super Admin to add fields on the Fields page.
          </p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="mx-auto mt-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            <FiRefreshCw size={14} />
            Retry loading
          </button>
        </section>
      ) : fields.length > 0 ? (
        <div className="space-y-4">
          <section>
            <DynamicFieldsForm
              fields={fields}
              syncVersion={syncVersion}
              currentUserName={defaultName}
              canReset={role === 'superadmin'}
              onBoxChange={updateBox}
              onDetailsChange={updateDetails}
              onResetField={resetSingleField}
            />
          </section>
          {fields.length > 1 && (
            <FinalTotalCard
              fields={fields}
              label={finalTotalLabel}
              icon={finalTotalIcon}
              sign={finalTotalSign}
            />
          )}
        </div>
      ) : null}

    </div>
  );
}
