'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';

type DetailRow = {
  id: number;
  name: string;
  value: number;
};

export type BoxDetail = { name: string; value: number };

let nextRowId = 1;

function newRow(value = 0): DetailRow {
  return { id: nextRowId++, name: '', value };
}

export default function TallyBox({
  idPrefix,
  index,
  name,
  value,
  details,
  onNameChange,
  onDetailsChange,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  value: number;
  details?: BoxDetail[];
  onNameChange?: (name: string) => void;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[]>(() =>
    details?.length
      ? details.map((detail) => ({ id: nextRowId++, name: detail.name, value: detail.value }))
      : [newRow(value)],
  );
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.value, 0), [rows]);
  const title = name?.trim() || `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setRows([newRow()]);
    }
  }, [value]);

  function updateRow(id: number, changes: Partial<DetailRow>) {
    const next = rows.map((row) => (row.id === id ? { ...row, ...changes } : row));
    setRows(next);
    onChange(next.reduce((sum, row) => sum + row.value, 0));
    onDetailsChange?.(next.map(({ name, value }) => ({ name, value })));
  }

  function addRow() {
    setRows((current) => {
      const next = [...current, newRow()];
      onDetailsChange?.(next.map(({ name, value }) => ({ name, value })));
      return next;
    });
  }

  function removeRow(id: number) {
    const next = rows.filter((row) => row.id !== id);
    const remaining = next.length ? next : [newRow()];
    setRows(remaining);
    onChange(remaining.reduce((sum, row) => sum + row.value, 0));
    onDetailsChange?.(remaining.map(({ name, value }) => ({ name, value })));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-4 text-left shadow-[0_8px_24px_rgba(0,107,196,0.08)] transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(0,107,196,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
      >
        <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-blue-100/60 transition group-hover:bg-blue-200/70" />
        <span className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-display text-base text-white shadow-sm">
            {index}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-blue-950">{title}</span>
            <span className="block text-[10px] uppercase tracking-wider text-blue-700/55">Click to edit</span>
          </span>
        </span>
        <span className="relative mt-4 flex items-end justify-between border-t border-dashed border-blue-200 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-800/45">Total</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-blue-950">{value}</span>
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
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-blue-950">{title}</h3>
                <p className="text-xs text-blue-900/45">
                  {onNameChange ? 'Customize the box name, then enter names and values below.' : 'Enter names and values below.'}
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
              <div className="mb-2 grid grid-cols-[1fr_8rem_2.5rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                <span>Name</span>
                <span>Value</span>
                <span />
              </div>
              <div className="space-y-2">
                {rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_8rem_2.5rem] gap-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(event) => updateRow(row.id, { name: event.target.value })}
                      placeholder="Enter name"
                      className="min-w-0 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <SignedNumberInput
                      value={row.value}
                      onChange={(value) => updateRow(row.id, { value })}
                      label={`${row.name || 'Item'} value`}
                    />
                    <button type="button" onClick={() => removeRow(row.id)} aria-label="Remove row" className="flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
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
      className="min-w-0 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-right font-mono text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
    />
  );
}
