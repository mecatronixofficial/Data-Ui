'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiEdit3, FiX } from 'react-icons/fi';
import { type BoxDetail } from '@/components/TallyBox';
import { type Operator } from '@/components/OperatorToggle';
import DynamicFieldsForm, { FinalTotalCard, type FieldValue, fieldTotal } from '@/components/DynamicFieldsForm';
import { api, blankBoxDetail, type BoxFieldDef } from '@/lib/api';

type FieldConfig = {
  name: string;
  icon?: string;
  boxNames: string[];
  boxIcons?: string[];
  boxFields?: BoxFieldDef[][];
  calcType: 'grouped' | 'signed';
  groupSplit: number;
};

function blankField(config: FieldConfig): FieldValue {
  return {
    name: config.name,
    icon: config.icon,
    boxNames: [...config.boxNames],
    boxIcons: config.boxIcons ? [...config.boxIcons] : undefined,
    boxFields: config.boxFields ? [...config.boxFields] : undefined,
    boxes: Array(config.boxNames.length).fill(0),
    details: config.boxNames.map(() => []),
    calcType: config.calcType,
    groupSplit: config.groupSplit,
    operator: '+',
  };
}

export default function NewEntryPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const editingId = params?.id;
  const isEditing = Boolean(editingId);
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<'saved' | 'canceled' | null>(null);
  const [returnToReports, setReturnToReports] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(true);

  useEffect(() => {
    if (editingId) return;
    Promise.all([api.me(), api.getMyFields()])
      .then(([user, myFields]) => {
        if (user.role === 'superadmin') {
          router.replace('/dashboard');
          return;
        }
        const configs: FieldConfig[] = myFields.map((f: any) => ({
          name: f.name,
          icon: f.icon,
          boxNames: f.boxNames,
          boxIcons: f.boxIcons,
          boxFields: f.boxFields,
          calcType: f.calcType,
          groupSplit: f.groupSplit,
        }));
        setFieldConfigs(configs);
        setFields(configs.map(blankField));
        setDefaultName(user.name);
        setName(user.name);
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

  const fieldTotals = fields.map(fieldTotal);

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
      await api.createEntry(payload);
      resetForm();
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
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-900/40">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">

      {/* ── Page header ── */}
      <div className="relative rounded-2xl p-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-blue-900/50">
              {isEditing ? 'Admin action' : 'New record'}
            </p>
            <h1 className="font-display text-lg text-blue-950 sm:text-xl">
              {isEditing ? 'Edit Entry' : 'Data Entry'}
            </h1>
          </div>

          {/* Date + live time */}
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <p className="text-xs text-blue-900/50">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-blue-50/60 font-mono text-xs text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>
      </div>

      {/* ── Record details (name) ── */}
      <div className="py-1 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiEdit3 size={11} aria-hidden="true" />
          </div>
          <h2 className="font-display text-base text-blue-950">Record details</h2>
        </div>

        <div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entry name"
            className="w-full rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-1.5 text-xs text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      </div>

      {/* ── Fields ── */}
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          No fields are configured yet. Ask a superadmin to set up fields.
        </div>
      ) : (
        <>
          <DynamicFieldsForm
            fields={fields}
            currentUserName={defaultName}
            onBoxChange={updateBox}
            onDetailsChange={updateDetails}
          />
          <FinalTotalCard
            fieldNames={fields.map((f) => f.name)}
            fieldTotals={fieldTotals}
          />
        </>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle /> {error}
        </p>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        {/* Save — 3-D raised button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_6px_20px_rgba(0,107,196,0.45),inset_0_1px_0_rgba(255,255,255,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,107,196,0.55)] active:translate-y-0 active:shadow-[0_3px_10px_rgba(0,107,196,0.35)] disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <span className="relative flex items-center gap-2">
            <FiCheck size={16} />
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save'}
          </span>
        </button>

        {/* Cancel — ghost */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-6 py-3 font-medium text-blue-800 shadow-[0_2px_8px_rgba(0,107,196,0.08)] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <FiX size={16} /> Cancel
        </button>
      </div>

      {/* ── Feedback modal ── */}
      {feedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-feedback-title"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
            {/* top-edge highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.10)] ${feedback === 'saved'
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_4px_14px_rgba(0,107,196,0.35)]'
                : 'bg-amber-100 text-amber-700'
              }`}>
              {feedback === 'saved' ? <FiCheck size={24} /> : <FiX size={24} />}
            </div>

            <h2 id="entry-feedback-title" className="font-display text-2xl text-blue-950">
              {feedback === 'saved' ? 'Saved successfully' : 'Canceled'}
            </h2>
            <p className="mt-2 text-sm text-blue-900/55">
              {feedback === 'saved' ? 'Your entry has been saved.' : 'Your changes were not saved.'}
            </p>

            <button
              onClick={closeFeedback}
              className="relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,107,196,0.45)]"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              {returnToReports ? 'Return to reports' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
