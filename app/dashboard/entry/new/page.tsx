'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiAlertCircle, FiCalendar, FiCheck, FiClock, FiRefreshCw, FiUser, FiX } from 'react-icons/fi';
import { type BoxDetail } from '@/components/TallyBox';
import { type Operator } from '@/components/OperatorToggle';
import DynamicFieldsForm, { FinalTotalCard, type FieldValue } from '@/components/DynamicFieldsForm';
import { api, blankBoxDetail, computeFieldLocked, type BoxFieldDef, type FinalTotalSign } from '@/lib/api';

type FieldConfig = {
  name: string;
  icon?: string;
  boxNames: string[];
  boxIcons?: string[];
  boxColors?: string[];
  boxFields?: BoxFieldDef[][];
  calcType: 'grouped' | 'signed';
  groupSplit: number;
  locked?: boolean;
};

function blankField(config: FieldConfig): FieldValue {
  return {
    name: config.name,
    icon: config.icon,
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

export default function NewEntryPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const editingId = params?.id;
  const isEditing = Boolean(editingId);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [fields, setFields] = useState<FieldValue[]>([]);
  const [finalTotalLabel, setFinalTotalLabel] = useState('Final Total');
  const [finalTotalIcon, setFinalTotalIcon] = useState('');
  const [finalTotalSign, setFinalTotalSign] = useState<FinalTotalSign>('add');
  // Regular users only ever have one entry (their name is the record's unique
  // name). When it already exists we load its saved values here and switch
  // handleSave from create → update, instead of colliding on the name.
  const [myEntryId, setMyEntryId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<'saved' | 'canceled' | null>(null);
  const [returnToReports, setReturnToReports] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(true);

  useEffect(() => {
    if (editingId) return;
    Promise.all([api.me(), api.getMyFields(), api.myEntries(), api.getFieldEditLocks()])
      .then(([user, myFields, myEntries, editLocks]) => {
        if (user.role === 'superadmin') {
          router.replace('/dashboard');
          return;
        }
        const lockByName = new Map(editLocks.map((l) => [l.name, l.userOnlyEdit]));
        const configs: FieldConfig[] = myFields.map((f: any) => ({
          name: f.name,
          icon: f.icon,
          boxNames: f.boxNames,
          boxIcons: f.boxIcons,
          boxColors: f.boxColors,
          boxFields: f.boxFields,
          calcType: f.calcType,
          groupSplit: f.groupSplit,
          locked: computeFieldLocked(user.role, Boolean(lockByName.get(f.name))),
        }));
        setFieldConfigs(configs);
        setDefaultName(user.name);
        setRole(user.role || '');

        // This user already has a saved record — load its values instead of a
        // blank form, and remember its id so Save updates it rather than
        // trying (and failing) to create a second entry under the same name.
        const existing = myEntries?.[0];
        if (existing) {
          setMyEntryId(existing._id);
          setName(existing.name);
          setDate(new Date(existing.date).toISOString().split('T')[0]);
          const existingByName = new Map(existing.fields.map((f: any) => [f.name, f]));
          setFields(configs.map((config) => {
            const saved: any = existingByName.get(config.name);
            if (!saved) return blankField(config);
            return {
              name: config.name,
              icon: config.icon,
              boxNames: [...config.boxNames],
              boxIcons: config.boxIcons ? [...config.boxIcons] : undefined,
              boxColors: config.boxColors ? [...config.boxColors] : undefined,
              boxFields: config.boxFields ? [...config.boxFields] : undefined,
              boxes: [...saved.boxes],
              details: saved.boxes.map((value: number, index: number) =>
                saved.details?.[index]?.length ? saved.details[index] : [blankBoxDetail(value)],
              ),
              calcType: config.calcType,
              groupSplit: config.groupSplit,
              operator: (saved.operator as Operator) || '+',
              locked: config.locked,
            };
          }));
        } else {
          setName(user.name);
          setFields(configs.map(blankField));
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoadingEntry(false));
  }, [editingId, router]);

  useEffect(() => {
    if (!editingId) return;
    api.me()
      .then((user) => {
        if (user.role !== 'superadmin') {
          router.replace('/dashboard');
          return null;
        }
        setDefaultName(user.name);
        setRole(user.role || '');
        return api.getEntry(editingId);
      })
      .then((entry) => {
        if (!entry) return;
        setName(entry.name);
        setDate(new Date(entry.date).toISOString().split('T')[0]);
        const loadedFields: FieldValue[] = entry.fields.map((f: any) => ({
          name: f.name,
          boxNames: [...f.boxNames],
          boxFields: f.boxFields,
          boxes: [...f.boxes],
          details: f.boxes.map((value: number, index: number) =>
            f.details?.[index]?.length ? f.details[index] : [blankBoxDetail(value)],
          ),
          calcType: f.calcType,
          groupSplit: f.groupSplit,
          operator: (f.operator as Operator) || '+',
        }));
        setFieldConfigs(loadedFields.map((f) => ({ name: f.name, boxNames: f.boxNames, boxFields: f.boxFields, calcType: f.calcType, groupSplit: f.groupSplit })));
        setFields(loadedFields);
      })
      .catch((err: any) => setError(err.message || 'Could not load entry'))
      .finally(() => setLoadingEntry(false));
  }, [editingId, router]);

  useEffect(() => {
    api.getFinalTotalSettings()
      .then((settings) => {
        setFinalTotalLabel(settings.label);
        setFinalTotalIcon(settings.icon);
        setFinalTotalSign(settings.sign);
      })
      .catch(() => { });
  }, []);

  function updateBox(fieldIndex: number, boxIndex: number, value: number) {
    setFields((prev) => {
      const next = [...prev];
      const boxes = [...next[fieldIndex].boxes];
      boxes[boxIndex] = value;
      next[fieldIndex] = { ...next[fieldIndex], boxes };
      return next;
    });
  }

  function updateDetails(fieldIndex: number, boxIndex: number, details: BoxDetail[]) {
    setFields((prev) => {
      const next = [...prev];
      const fieldDetails = [...next[fieldIndex].details];
      fieldDetails[boxIndex] = details;
      next[fieldIndex] = { ...next[fieldIndex], details: fieldDetails };
      return next;
    });
  }

  function resetForm() {
    setName(defaultName);
    setDate(new Date().toISOString().split('T')[0]);
    setFields(fieldConfigs.map(blankField));
    setError('');
  }

  function resetFieldValues() {
    setFields(fieldConfigs.map(blankField));
  }

  function resetSingleField(fieldIndex: number) {
    setFields((prev) => {
      const next = [...prev];
      next[fieldIndex] = blankField(fieldConfigs[fieldIndex]);
      return next;
    });
  }

  function handleCancel() {
    if (!isEditing) resetForm();
    setReturnToReports(isEditing);
    setFeedback('canceled');
  }

  function closeFeedback() {
    setFeedback(null);
    if (returnToReports) router.push('/dashboard/reports');
  }

  async function handleSave() {
    setError('');
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Please enter a name before saving.');
      return;
    }
    if (fields.length === 0) {
      setError('No fields are configured yet. Contact your admin.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: normalizedName,
        date,
        fields: fields.map((field) => ({
          name: field.name,
          boxes: field.boxes,
          details: field.details,
          operator: field.operator,
        })),
        fieldOperators: fields.length > 1 ? Array(fields.length - 1).fill('+') : [],
      };
      if (editingId) {
        await api.updateEntry(editingId, payload);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setReturnToReports(true);
        setFeedback('saved');
        return;
      }
      if (myEntryId) {
        await api.updateEntry(myEntryId, payload);
      } else {
        const created = await api.createEntry(payload);
        setMyEntryId(created._id);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setReturnToReports(false);
      setFeedback('saved');
    } catch (err: any) {
      setError(err.message || 'Could not save entry');
    } finally {
      setSaving(false);
    }
  }

  if (loadingEntry) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white px-12 py-10 text-center shadow-[0_24px_70px_rgba(7,39,71,0.12)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 shadow-[0_12px_30px_rgba(7,39,71,0.25)]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          </div>
          <p className="font-display text-lg font-semibold text-blue-950">Preparing your workspace</p>
          <p className="mt-1 text-xs text-blue-900/45">Loading fields and saved values...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <header className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_8px_28px_rgba(7,39,71,0.07)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
        <div className="grid gap-2 lg:grid-cols-[minmax(16rem,1fr)_auto_auto] lg:items-stretch">
          <label className="group relative flex min-w-0 items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/35 px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <FiUser size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[7px] font-semibold uppercase tracking-[0.17em] text-blue-900/40">Record name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter a record name"
                className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-semibold text-blue-950 outline-none placeholder:font-normal placeholder:text-blue-900/25"
              />
            </span>
          </label>

          <div className="relative inline-flex items-stretch rounded-xl border border-blue-100 bg-white p-1">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-950">
              <FiClock size={14} className="text-blue-600" aria-hidden="true" />
              <span>
                <span className="block text-[6px] font-semibold uppercase tracking-[0.16em] text-blue-900/35">Time</span>
                <span className="block font-mono text-xs font-semibold leading-tight">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </div>
            <label className="group relative ml-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-blue-50">
              <FiCalendar size={14} className="text-blue-600" aria-hidden="true" />
              <span className="min-w-[7rem]">
                <span className="block text-[6px] font-semibold uppercase tracking-[0.16em] text-blue-900/35">Date</span>
                <span className="block font-mono text-[11px] font-semibold leading-tight text-blue-950">
                  {new Date(`${date}T00:00:00`).toLocaleDateString([], {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-label="Entry date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>

          <div className="relative flex items-stretch">
            <span className="flex min-w-[4.25rem] flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 px-3">
              <span className="font-mono text-base font-semibold leading-none text-blue-800">{fields.length}</span>
              <span className="mt-1 text-[7px] font-semibold uppercase tracking-[0.15em] text-blue-900/35">
                {fields.length === 1 ? 'Field' : 'Fields'}
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap justify-end gap-2">
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
          onClick={handleCancel}
          className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/20"
        >
          <FiX size={14} /> Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex min-w-[7.25rem] items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(0,107,196,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_9px_20px_rgba(0,107,196,0.28)] disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiCheck size={14} />}
          {isEditing || myEntryId
            ? (saving ? 'Updating...' : 'Update')
            : (saving ? 'Saving...' : 'Save')}
        </button>
      </div>


      {fields.length === 0 ? (
        <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-[0_12px_35px_rgba(120,53,15,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FiAlertCircle size={21} />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-amber-950">No fields configured</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-amber-800/70">
            Ask a superadmin to configure the entry fields before you begin.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          <section>
            <DynamicFieldsForm
              fields={fields}
              currentUserName={defaultName}
              canReset={role === 'superadmin'}
              onBoxChange={updateBox}
              onDetailsChange={updateDetails}
              onResetField={resetSingleField}
            />
          </section>
          <FinalTotalCard
            fields={fields}
            label={finalTotalLabel}
            icon={finalTotalIcon}
            sign={finalTotalSign}
          />
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <FiAlertCircle size={16} />
          </span>
          <div>
            <p className="font-semibold">Unable to save this entry</p>
            <p className="mt-0.5 text-xs text-red-700/75">{error}</p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-feedback-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeFeedback();
          }}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 bg-white p-6 text-center shadow-[0_30px_90px_rgba(7,39,71,0.35)]">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${feedback === 'saved'
                ? 'bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300'
                : 'bg-gradient-to-r from-amber-500 via-amber-300 to-orange-300'
              }`} />
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${feedback === 'saved'
                ? 'bg-blue-950 text-white shadow-[0_12px_28px_rgba(7,39,71,0.25)]'
                : 'bg-amber-100 text-amber-700 shadow-[0_12px_28px_rgba(120,53,15,0.14)]'
              }`}>
              {feedback === 'saved' ? <FiCheck size={24} /> : <FiX size={24} />}
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600/55">
              {feedback === 'saved' ? 'All done' : 'Action canceled'}
            </p>
            <h2 id="entry-feedback-title" className="mt-1 font-display text-xl font-semibold text-blue-950">
              {feedback === 'saved' ? 'Entry saved successfully' : 'Changes discarded'}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-blue-900/55">
              {feedback === 'saved'
                ? 'Your latest values are safely stored and ready for reporting.'
                : 'No new changes were saved to this entry.'}
            </p>
            <button
              onClick={closeFeedback}
              className="mt-6 w-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(0,107,196,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,107,196,0.4)]"
            >
              {returnToReports ? 'Return to reports' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
