'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiClock, FiRefreshCw, FiUser, FiX } from 'react-icons/fi';
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

// Keep the clock state below this component boundary so large entry forms do not
// re-render every second.
function CurrentDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <FiClock size={13} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[8px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Current date &amp; time</span>
        <span className="mt-0.5 block whitespace-nowrap font-mono text-[10px] font-bold text-blue-950">
          {now
            ? `${now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} · ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Loading time…'}
        </span>
      </span>
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

  const lastUpdatedDateTime = lastUpdatedAt ? new Date(lastUpdatedAt) : null;

  return (
    <div className="entry-page space-y-3 pb-4">
      <header className="relative grid grid-cols-1 gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 pl-6 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.45)] md:grid-cols-2">
        <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-blue-800" aria-hidden="true" />
        <div className="order-2 flex flex-col items-stretch gap-3 md:col-start-2 md:row-start-1 md:items-end">
          <div className="flex min-h-10 min-w-[9rem] items-center md:justify-end md:text-right">
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[8px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                Updated
              </span>
              {lastUpdatedDateTime ? (
                <span className="mt-0.5 block whitespace-nowrap font-mono font-bold leading-tight">
                  <span className="block text-[10px] text-blue-950 flex flex-row items-center gap-1">
                    {lastUpdatedDateTime.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}  <span className="mt-0.5 block text-[9px] text-slate-500">{lastUpdatedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </span>
              ) : (
                <span className="mt-1 block whitespace-nowrap text-[9px] font-bold leading-tight text-slate-400">Not saved yet</span>
              )}
            </span>
          </div>

          {fields.length > 0 && (
            <div className="flex w-full flex-wrap items-center gap-2 md:justify-end">
              {role === 'superadmin' && (
                <button
                  type="button"
                  onClick={resetFieldValues}
                  className="flex h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/30"
                >
                  <FiRefreshCw size={14} /> Reset fields
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                aria-label={isEditing || myEntryId ? (saving ? 'Updating' : 'Update') : (saving ? 'Saving' : 'Save')}
                className="group flex h-11 min-w-[6.5rem] items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white shadow-[0_10px_22px_-12px_rgba(0,107,196,0.7)] transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {saving
                  ? <FiRefreshCw className="animate-spin" size={15} />
                  : <FiCheck size={16} />}
                {isEditing || myEntryId ? (saving ? 'Updating…' : 'Update') : (saving ? 'Saving…' : 'Save')}
              </button>
            </div>
          )}
        </div>
        <div className="order-1 flex flex-col items-stretch gap-4 md:col-start-1 md:row-start-1">
          <label className="group relative flex min-h-10 w-full min-w-[10rem] items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-950 text-white shadow-[0_8px_18px_-10px_rgba(7,39,71,0.8)]">
              <FiUser size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-blue-500">Report owner</span>
              <input
                value={name}
                readOnly
                placeholder="Enter a record name"
                className="mt-0.5 w-full cursor-default border-0 bg-transparent p-0 text-sm font-semibold text-blue-950 outline-none placeholder:font-normal placeholder:text-black"
              />
            </span>
          </label>

          <div className="border-t border-slate-100 pt-3">
            <CurrentDateTime />
          </div>
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
