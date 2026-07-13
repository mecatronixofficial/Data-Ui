'use client';

import { useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiCheckCircle, FiEdit3, FiX } from 'react-icons/fi';
import TallyBox from '@/components/TallyBox';
import OperatorToggle, { type Operator } from '@/components/OperatorToggle';
import { api } from '@/lib/api';

const emptyField1 = Array(10).fill(0);
const emptyField2 = Array(6).fill(0);

const defaultField1BoxNames = [
  'Box 1',
  'Box 2',
  'Box 3',
  'Box 4',
  'Box 5',
  'Box 6',
  'Box 7',
  'Box 8',
  'Box 9',
  'Box 10',
];

const defaultField2BoxNames = [
  'Box 1',
  'Box 2',
  'Box 3',
  'Box 4',
  'Box 5',
  'Box 6',
];

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
function applyOp(a: number, b: number, op: Operator) {
  switch (op) {
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? 0 : a / b;
    default:
      return a + b;
  }
}

export default function NewEntryPage() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [field1, setField1] = useState<number[]>([...emptyField1]);
  const [field1BoxNames, setField1BoxNames] = useState<string[]>([...defaultField1BoxNames]);
  const [operator1, setOperator1] = useState<Operator>('+');

  const [field2, setField2] = useState<number[]>([...emptyField2]);
  const [field2BoxNames, setField2BoxNames] = useState<string[]>([...defaultField2BoxNames]);
  const operator2: Operator = '+';

  const [operator3, setOperator3] = useState<Operator>('+');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const total1 = useMemo(() => sum(field1.slice(0, 7)), [field1]);
  const total2 = useMemo(() => sum(field1.slice(7, 10)), [field1]);
  const field1Total = useMemo(() => applyOp(total1, total2, operator1), [total1, total2, operator1]);

  const positiveTotal = useMemo(() => sum(field2.filter((value) => value > 0)), [field2]);
  const negativeTotal = useMemo(() => sum(field2.filter((value) => value < 0)), [field2]);
  const field2Total = useMemo(() => positiveTotal + negativeTotal, [positiveTotal, negativeTotal]);

  const finalTotal = useMemo(
    () => applyOp(field1Total, field2Total, operator3),
    [field1Total, field2Total, operator3],
  );

  function updateBox(list: number[], setList: (v: number[]) => void, idx: number, val: number) {
    const next = [...list];
    next[idx] = val;
    setList(next);
  }

  function updateBoxName(list: string[], setList: (v: string[]) => void, idx: number, val: string) {
    const next = [...list];
    next[idx] = val;
    setList(next);
  }

  function resetForm() {
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setField1([...emptyField1]);
    setField2([...emptyField2]);
    setField1BoxNames([...defaultField1BoxNames]);
    setField2BoxNames([...defaultField2BoxNames]);
    setOperator1('+');
    setOperator3('+');
    setError('');
    setSavedMessage('');
  }

  async function handleSave() {
    setError('');
    setSavedMessage('');
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Please enter a name before saving.');
      return;
    }
    setSaving(true);
    try {
      await api.createEntry({
        name: normalizedName,
        date,
        field1Boxes: field1,
        field1BoxNames: field1BoxNames.map((boxName, index) => boxName.trim() || `Box ${index + 1}`),
        operator1,
        field2Boxes: field2,
        field2BoxNames: field2BoxNames.map((boxName, index) => boxName.trim() || `Box ${index + 1}`),
        operator2,
        operator3,
      });
      resetForm();
      setSavedMessage('Entry saved.');
    } catch (err: any) {
      setError(err.message || 'Could not save entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">New record</p>
        <h1 className="font-display text-4xl text-emerald-950">Data Entry</h1>
        <p className="mt-2 text-sm text-ink/55">Enter your figures below and review the calculated total before saving.</p>
      </div>

      {/* Name & Date */}
      <div className="grid grid-cols-1 gap-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_14px_40px_rgba(6,78,59,0.08)] sm:grid-cols-2">
        <div className="flex items-center gap-3 sm:col-span-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FiEdit3 size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl text-emerald-950">Record details</h2>
            <p className="text-xs text-ink/45">Identify this entry with a name and date.</p>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entry name"
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-900/65">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 font-mono text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
      </div>

      {/* Stage 1 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_14px_40px_rgba(6,78,59,0.08)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-display text-lg text-white shadow-md shadow-emerald-900/15">01</span>
          <div>
            <h2 className="font-display text-xl text-emerald-950">Field 1</h2>
            <p className="text-xs text-ink/45">10 boxes — boxes 1–7 and 8–10 combine into the field total</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          {field1.map((val, i) => (
            <TallyBox
              idPrefix="field-1"
              key={i}
              index={i + 1}
              name={field1BoxNames[i]}
              value={val}
              onNameChange={(nextName) => updateBoxName(field1BoxNames, setField1BoxNames, i, nextName)}
              onChange={(v) => updateBox(field1, setField1, i, v)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
          <TotalPill label="Total 1 (1–7)" value={total1} />
          <OperatorToggle value={operator1} onChange={setOperator1} />
          <TotalPill label="Total 2 (8–10)" value={total2} />
          <span className="text-ink/30 font-display text-xl pb-2">=</span>
          <TotalPill label="Field 1 Total" value={field1Total} emphasize colorBySign />
        </div>
      </section>

      {/* Stage 2 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_14px_40px_rgba(6,78,59,0.08)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-display text-lg text-white shadow-md shadow-emerald-900/15">02</span>
          <div>
            <h2 className="font-display text-xl text-emerald-950">Field 2</h2>
            <p className="text-xs text-ink/45">6 boxes — positive and negative values are grouped automatically, regardless of order</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          {field2.map((val, i) => (
            <TallyBox
              idPrefix="field-2"
              key={i}
              index={i + 1}
              name={field2BoxNames[i]}
              value={val}
              onNameChange={(nextName) => updateBoxName(field2BoxNames, setField2BoxNames, i, nextName)}
              onChange={(v) => updateBox(field2, setField2, i, v)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
          <TotalPill label="Positive total" value={positiveTotal} colorBySign />
          <span className="pb-2 font-display text-xl text-emerald-700">+</span>
          <TotalPill label="Negative total" value={negativeTotal} colorBySign />
          <span className="text-ink/30 font-display text-xl pb-2">=</span>
          <TotalPill label="Field 2 Total" value={field2Total} emphasize colorBySign />
        </div>
      </section>

      {/* Stage 3 — Final receipt */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600 p-6 text-white shadow-[0_20px_50px_rgba(6,78,59,0.25)]">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 font-display text-lg text-white">03</span>
          <div>
            <h2 className="font-display text-xl">Final Total</h2>
            <p className="text-xs text-emerald-50/60">Field 1 Total and Field 2 Total combine into the final figure</p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-end justify-center gap-4 py-2">
          <TotalPill label="Field 1 Total" value={field1Total} dark colorBySign />
          <OperatorToggle value={operator3} onChange={setOperator3} />
          <TotalPill label="Field 2 Total" value={field2Total} dark colorBySign />
        </div>

        <div className="relative mt-5 flex items-center justify-between border-t border-dashed border-white/20 pt-5">
          <span className="text-xs uppercase tracking-widest text-emerald-50/60">Final Total</span>
          <span
            className={`font-mono text-4xl font-semibold tabular ${
              finalTotal < 0 ? 'text-red-300' : finalTotal > 0 ? 'text-emerald-200' : 'text-white'
            }`}
          >
            {finalTotal}
          </span>
        </div>
      </section>

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}
      {savedMessage && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><FiCheckCircle />{savedMessage}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <FiCheck /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={resetForm}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 font-medium text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <FiX /> Cancel
        </button>
      </div>
    </div>
  );
}

function TotalPill({
  label,
  value,
  emphasize,
  dark,
  colorBySign,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
  dark?: boolean;
  colorBySign?: boolean;
}) {
  const signStyle = colorBySign
    ? value < 0
      ? dark
        ? 'border border-red-300/40 bg-red-500/20 text-red-200'
        : 'bg-red-600 text-white shadow-md shadow-red-900/10'
      : value > 0
        ? dark
          ? 'border border-emerald-300/40 bg-emerald-400/20 text-emerald-100'
          : 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
        : ''
    : '';

  const defaultStyle = emphasize
    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
    : dark
      ? 'border border-white/15 bg-white/10 text-white'
      : 'border border-emerald-100 bg-white text-emerald-950';

  return (
    <div className="flex flex-col items-center">
      <span className={`mb-1 text-[10px] uppercase tracking-wider ${dark ? 'text-emerald-50/60' : 'text-emerald-900/45'}`}>
        {label}
      </span>
      <span
        className={`rounded-lg px-3 py-1.5 font-mono text-lg tabular ${signStyle || defaultStyle}`}
      >
        {value}
      </span>
    </div>
  );
}
