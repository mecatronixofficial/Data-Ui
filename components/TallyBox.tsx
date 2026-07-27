'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { FieldIcon } from './IconPicker';
import { type BoxDetail, type BoxFieldDef, blankBoxDetail } from '@/lib/api';

export type { BoxDetail, BoxFieldDef };

type DetailRow = { id: number } & BoxDetail;

let nextRowId = 1;

// Entries saved before boxes had a fixed Name/Value shape used capitalized keys.
function normalizeRow(raw: any): BoxDetail {
  if (raw && typeof raw === 'object') {
    if ('name' in raw || 'value' in raw) return { name: raw.name ?? '', value: Number(raw.value) || 0 };
    if ('Name' in raw || 'Value' in raw) return { name: raw.Name ?? '', value: Number(raw.Value) || 0 };
  }
  return blankBoxDetail();
}

function rowTotal(row: DetailRow) {
  return Number(row.value) || 0;
}

// A box still using the original two-column Name/Value shape (the vast majority of
// boxes, including every box saved before per-box custom columns existed) keeps using
// the editor below completely unchanged. Anything else — e.g. a "Team Box" layout with
// its own Date/In/Out/Sent-By columns — renders through CustomTallyBox instead.
function isCustomBoxFields(fields?: BoxFieldDef[]) {
  if (!fields || fields.length === 0) return false;
  if (fields.length !== 2) return true;
  const [a, b] = fields;
  return !(
    a.label.trim().toLowerCase() === 'name' && a.type === 'text' &&
    b.label.trim().toLowerCase() === 'value' && b.type === 'number'
  );
}

export default function TallyBox(props: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  value: number;
  details?: BoxDetail[];
  boxFields?: BoxFieldDef[];
  currentUserName?: string;
  onNameChange?: (name: string) => void;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  if (isCustomBoxFields(props.boxFields)) {
    return (
      <CustomTallyBox
        idPrefix={props.idPrefix}
        index={props.index}
        name={props.name}
        icon={props.icon}
        value={props.value}
        details={props.details}
        fields={props.boxFields!}
        currentUserName={props.currentUserName}
        onDetailsChange={props.onDetailsChange}
        onChange={props.onChange}
      />
    );
  }
  return <LegacyTallyBox {...props} />;
}

function LegacyTallyBox({
  idPrefix,
  index,
  name,
  icon,
  value,
  details,
  onNameChange,
  onDetailsChange,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  value: number;
  details?: BoxDetail[];
  onNameChange?: (name: string) => void;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[]>(() =>
    details?.length
      ? details.map((detail) => ({ id: nextRowId++, ...normalizeRow(detail) }))
      : [{ id: nextRowId++, ...blankBoxDetail(value) }],
  );
  const total = useMemo(() => rows.reduce((sum, row) => sum + rowTotal(row), 0), [rows]);
  const title = name?.trim() || `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setRows([{ id: nextRowId++, ...blankBoxDetail(0) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(next: DetailRow[]) {
    setRows(next);
    onChange(next.reduce((sum, row) => sum + rowTotal(row), 0));
    onDetailsChange?.(next.map(({ id, ...detail }) => detail));
  }

  function updateRowName(id: number, name: string) {
    emit(rows.map((row) => (row.id === id ? { ...row, name } : row)));
  }

  function updateRowValue(id: number, value: number) {
    emit(rows.map((row) => (row.id === id ? { ...row, value } : row)));
  }

  function addRow() {
    emit([...rows, { id: nextRowId++, ...blankBoxDetail() }]);
  }

  function removeRow(id: number) {
    const next = rows.filter((row) => row.id !== id);
    emit(next.length ? next : [{ id: nextRowId++, ...blankBoxDetail() }]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${title}, click to edit`}
        className="group relative w-full overflow-hidden rounded-lg border border-blue-100 bg-white p-2.5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(0,107,196,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
      >
        <span className="flex items-center justify-between gap-1.5">
          <span className={value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-600'}>
            <FieldIcon icon={icon} size={13} />
          </span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-blue-900/40">{title}</span>
        </span>
        <span
          className={`mt-1 block font-mono text-base font-bold tabular-nums ${
            value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-950'
          }`}
        >
          {value}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idPrefix}-box-${index}-title`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-blue-950">{title}</h3>
                <p className="text-xs text-blue-900/45">
                  {onNameChange ? 'Customize the box name, then enter values below.' : 'Enter values below.'}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close popup" className="rounded-lg p-2 text-blue-900/45 hover:bg-blue-50 hover:text-blue-800">
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {onNameChange && (
                <div className="mb-5">
                  <label
                    htmlFor={`${idPrefix}-box-${index}-name`}
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-blue-900/45"
                  >
                    Box name
                  </label>
                  <input
                    id={`${idPrefix}-box-${index}-name`}
                    type="text"
                    value={name ?? ''}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder={`Box ${index}`}
                    className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm font-semibold text-blue-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              )}
              <div className="mb-2 flex gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                <span className="min-w-0 flex-1 truncate">Name</span>
                <span className="w-24 shrink-0 truncate">Value</span>
                <span className="w-9 shrink-0" />
              </div>
              <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                  <div key={row.id} className="flex gap-2">
                    <input
                      type="text"
                      value={String(row.name ?? '')}
                      onChange={(event) => updateRowName(row.id, event.target.value)}
                      placeholder="Name"
                      aria-label={`Row ${rowIndex + 1} name`}
                      className="min-w-0 flex-1 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <div className="w-24 shrink-0">
                      <SignedNumberInput
                        value={Number(row.value) || 0}
                        onChange={(v) => updateRowValue(row.id, v)}
                        label={`Row ${rowIndex + 1} value`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove row"
                      className="flex w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addRow} className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                <FiPlus /> Add another
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              <div>
                <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-blue-900/50">Total</span>
                <span className="font-mono text-2xl font-semibold tabular-nums text-blue-950">{total}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sums whichever number column(s) are flagged sumTotal; if a custom layout doesn't flag
// any, every number/computed column counts (keeps totals sane even if an admin forgets to flag one).
function customRowValue(row: Record<string, unknown>, fields: BoxFieldDef[]) {
  const numberFields = fields.filter((f) => f.type === 'number' || f.type === 'computed');
  const flagged = numberFields.filter((f) => f.sumTotal);
  const counted = flagged.length ? flagged : numberFields;
  return counted.reduce((sum, f) => sum + (Number(row[f.label]) || 0), 0);
}

// Fills in every 'computed' column from its formula's two source columns (matched by label).
// Runs in field order, so a computed column may itself feed a later computed column
// (e.g. USD x Rate -> INR, then INR + Bonus% -> Value).
function computeRow<T extends BoxDetail>(row: T, fields: BoxFieldDef[]): T {
  const next: BoxDetail = { ...row };
  for (const field of fields) {
    if (field.type !== 'computed' || !field.formula) continue;
    const a = Number(next[field.formula.a]) || 0;
    const b = Number(next[field.formula.b]) || 0;
    next[field.label] = field.formula.op === 'multiply' ? a * b : a + (a * b) / 100;
  }
  return next as T;
}

function blankCustomRow(fields: BoxFieldDef[], currentUserName?: string): BoxDetail {
  const row: BoxDetail = {};
  for (const field of fields) {
    if (field.auto === 'serial') continue; // computed from row position, never stored
    if (field.auto === 'user') { row[field.label] = currentUserName || ''; continue; }
    if (field.auto === 'constant') { row[field.label] = field.constant ?? 0; continue; }
    row[field.label] = field.type === 'number' || field.type === 'computed' ? 0 : '';
  }
  return computeRow(row, fields);
}

function CustomTallyBox({
  idPrefix,
  index,
  name,
  icon,
  value,
  details,
  fields,
  currentUserName,
  onDetailsChange,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  value: number;
  details?: BoxDetail[];
  fields: BoxFieldDef[];
  currentUserName?: string;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[]>(() =>
    details?.length
      ? details.map((detail) => computeRow({ id: nextRowId++, ...detail }, fields))
      : [{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }],
  );
  const total = useMemo(() => rows.reduce((sum, row) => sum + customRowValue(row, fields), 0), [rows, fields]);
  const title = name?.trim() || `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setRows([{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(next: DetailRow[]) {
    setRows(next);
    onChange(next.reduce((sum, row) => sum + customRowValue(row, fields), 0));
    onDetailsChange?.(next.map(({ id, ...detail }) => detail));
  }

  function updateCell(id: number, label: string, cellValue: string | number) {
    emit(rows.map((row) => (row.id === id ? computeRow({ ...row, [label]: cellValue }, fields) : row)));
  }

  function addRow() {
    emit([...rows, { id: nextRowId++, ...blankCustomRow(fields, currentUserName) }]);
  }

  function removeRow(id: number) {
    const next = rows.filter((row) => row.id !== id);
    emit(next.length ? next : [{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${title}, click to edit`}
        className="group relative w-full overflow-hidden rounded-lg border border-blue-100 bg-white p-2.5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(0,107,196,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
      >
        <span className="flex items-center justify-between gap-1.5">
          <span className={value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-600'}>
            <FieldIcon icon={icon} size={13} />
          </span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-blue-900/40">{title}</span>
        </span>
        <span
          className={`mt-1 block font-mono text-base font-bold tabular-nums ${
            value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-950'
          }`}
        >
          {value}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idPrefix}-box-${index}-title`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-blue-950">{title}</h3>
                <p className="text-xs text-blue-900/45">Add a row for each record, then enter values below.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close popup" className="rounded-lg p-2 text-blue-900/45 hover:bg-blue-50 hover:text-blue-800">
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-auto p-5">
              <table className="w-full min-w-max border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                    {fields.map((field) => (
                      <th key={field.label} className="px-1.5 pb-1 font-semibold">
                        {field.label}
                        {field.auto === 'constant' && (
                          <span className="ml-1 font-normal normal-case text-blue-900/40">({field.constant ?? 0})</span>
                        )}
                      </th>
                    ))}
                    <th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id}>
                      {fields.map((field) => (
                        <td key={field.label} className="px-1.5">
                          {field.auto === 'serial' ? (
                            <span className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg bg-blue-50/60 px-2 font-mono text-sm text-blue-900/50">
                              {rowIndex + 1}
                            </span>
                          ) : field.auto === 'constant' ? (
                            <span
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className="flex h-9 min-w-[6rem] items-center justify-end rounded-lg bg-blue-50/60 px-3 font-mono text-sm text-blue-900/70"
                            >
                              {Number(row[field.label]) || 0}
                            </span>
                          ) : field.type === 'computed' ? (
                            <span
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className="flex h-9 min-w-[6rem] items-center justify-end rounded-lg bg-blue-50/60 px-3 font-mono text-sm text-blue-900/70"
                            >
                              {Number(row[field.label]) || 0}
                            </span>
                          ) : field.type === 'number' ? (
                            <div className="w-24">
                              <SignedNumberInput
                                value={Number(row[field.label]) || 0}
                                onChange={(v) => updateCell(row.id, field.label, v)}
                                label={`Row ${rowIndex + 1} ${field.label}`}
                              />
                            </div>
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={String(row[field.label] ?? '')}
                              onChange={(event) => updateCell(row.id, field.label, event.target.value)}
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className="min-w-[9.5rem] rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            />
                          ) : field.type === 'time' ? (
                            <input
                              type="time"
                              value={String(row[field.label] ?? '')}
                              onChange={(event) => updateCell(row.id, field.label, event.target.value)}
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className="min-w-[7rem] rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(row[field.label] ?? '')}
                              onChange={(event) => updateCell(row.id, field.label, event.target.value)}
                              placeholder={field.label}
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className="min-w-[8rem] rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-1.5">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove row"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button type="button" onClick={addRow} className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                <FiPlus /> Add another
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              <div>
                <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-blue-900/50">Total</span>
                <span className="font-mono text-2xl font-semibold tabular-nums text-blue-950">{total}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SignedNumberInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const [text, setText] = useState(value === 0 ? '' : String(value));

  useEffect(() => setText(value === 0 ? '' : String(value)), [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        if (!/^-?\d*(\.\d*)?$/.test(next)) return;
        setText(next);
        if (next === '' || next === '-' || next === '.' || next === '-.') {
          if (next === '') onChange(0);
          return;
        }
        onChange(Number(next));
      }}
      onBlur={() => {
        if (text === '-' || text === '.' || text === '-.') setText(value === 0 ? '' : String(value));
      }}
      placeholder="0"
      aria-label={label}
      className="w-full min-w-0 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-right font-mono text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
    />
  );
}
