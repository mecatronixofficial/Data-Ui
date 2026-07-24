'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiEdit3, FiX } from 'react-icons/fi';
import { type BoxDetail } from '@/components/TallyBox';
import { type Operator } from '@/components/OperatorToggle';
import DynamicFieldsForm, { FinalTotalCard, type FieldValue, fieldTotal } from '@/components/DynamicFieldsForm';
import { api } from '@/lib/api';

type FieldConfig = {
  name: string;
  icon?: string;
  boxNames: string[];
  boxIcons?: string[];
  calcType: 'grouped' | 'signed';
  groupSplit: number;
};

function blankField(config: FieldConfig): FieldValue {
  return {
    name: config.name,
    icon: config.icon,
    boxNames: [...config.boxNames],
    boxIcons: config.boxIcons ? [...config.boxIcons] : undefined,
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
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

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
          calcType: f.calcType,
          groupSplit: f.groupSplit,
        }));
        setFieldConfigs(configs);
        setFields(configs.map(blankField));
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
        return api.getEntry(editingId);
      })
      .then((entry) => {
        if (!entry) return;
        setName(entry.name);
        setDate(new Date(entry.date).toISOString().split('T')[0]);
        const loadedFields: FieldValue[] = entry.fields.map((f: any) => ({
          name: f.name,
          boxNames: [...f.boxNames],
          boxes: [...f.boxes],
          details: f.boxes.map((value: number, index: number) =>
            f.details?.[index]?.length ? f.details[index] : [{ name: '', value }],
          ),
          calcType: f.calcType,
          groupSplit: f.groupSplit,
          operator: (f.operator as Operator) || '+',
        }));
        setFieldConfigs(loadedFields.map((f) => ({ name: f.name, boxNames: f.boxNames, calcType: f.calcType, groupSplit: f.groupSplit })));
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

  function updateFieldOperator(fieldIndex: number, op: Operator) {
    setFields((prev) => {
      const next = [...prev];
      next[fieldIndex] = { ...next[fieldIndex], operator: op };
      return next;
    });
  }

  function resetForm() {
    setName('');
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
      setError('No fields are configured for your role yet. Contact your admin.');
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
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-8 py-7 text-white shadow-[0_20px_50px_rgba(0,107,196,0.30)]">
        {/* depth layers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute -left-8 -top-8 h-[180%] w-2/5 rotate-12 bg-gradient-to-br from-white/8 via-white/4 to-transparent" />
        </div>
        {/* floating shape */}
        <div className="pointer-events-none absolute right-8 top-4 h-16 w-16 rounded-xl border border-white/10 bg-white/5 rotate-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/60">
              {isEditing ? 'Admin action' : 'New record'}
            </p>
            <h1 className="font-display text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-4xl">
              {isEditing ? 'Edit Entry' : 'Data Entry'}
            </h1>
          </div>

          {/* Date input — sits inside the hero */}
          <div className="sm:text-right">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/60">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 font-mono text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] outline-none backdrop-blur-sm transition placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/15"
            />
          </div>
        </div>
      </div>

      {/* ── Record details (name) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
        {/* top-edge 3-D highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(0,107,196,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <FiEdit3 size={18} aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl text-blue-950">Record details</h2>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-900/65">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entry name"
            className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      </div>

      {/* ── Fields ── */}
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          No fields are configured for your role yet. Ask a superadmin to set up fields.
        </div>
      ) : (
        <>
          <DynamicFieldsForm
            fields={fields}
            onBoxChange={updateBox}
            onDetailsChange={updateDetails}
            onOperatorChange={updateFieldOperator}
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

            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.10)] ${
              feedback === 'saved'
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
