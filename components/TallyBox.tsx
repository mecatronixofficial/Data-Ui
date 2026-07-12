'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';

type DetailRow = {
  id: number;
  name: string;
  value: number;
};

let nextRowId = 1;

function newRow(): DetailRow {
  return { id: nextRowId++, name: '', value: 0 };
}

export default function TallyBox({
  idPrefix,
  index,
  name,
  value,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[]>([newRow()]);
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.value, 0), [rows]);
  const title = name ?? `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setRows([newRow()]);
    }
  }, [value]);

  function updateRow(id: number, changes: Partial<DetailRow>) {
    const next = rows.map((row) => (row.id === id ? { ...row, ...changes } : row));
    setRows(next);
    onChange(next.reduce((sum, row) => sum + row.value, 0));
  }

  function addRow() {
    setRows((current) => [...current, newRow()]);
  }

  function removeRow(id: number) {
    const next = rows.filter((row) => row.id !== id);
    const remaining = next.length ? next : [newRow()];
    setRows(remaining);
    onChange(remaining.reduce((sum, row) => sum + row.value, 0));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-64 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-4 text-left shadow-[0_8px_24px_rgba(6,78,59,0.08)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_14px_30px_rgba(6,78,59,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25"
      >
        <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-emerald-100/60 transition group-hover:bg-emerald-200/70" />
        <span className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-display text-base text-white shadow-sm">
            {index}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-emerald-950">{title}</span>
            <span className="block text-[10px] uppercase tracking-wider text-emerald-700/55">Click to edit</span>
          </span>
        </span>
        <span className="relative mt-4 flex items-end justify-between border-t border-dashed border-emerald-200 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800/45">Total</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-emerald-950">{value}</span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idPrefix}-box-${index}-title`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-emerald-950">{title}</h3>
                <p className="text-xs text-ink/45">Enter names and values below.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close popup" className="rounded-lg p-2 text-ink/45 hover:bg-emerald-50 hover:text-emerald-800">
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="mb-2 grid grid-cols-[1fr_8rem_2.5rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-900/45">
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
                      className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.value === 0 ? '' : row.value}
                      onChange={(event) => updateRow(row.id, { value: event.target.value === '' ? 0 : Number(event.target.value) })}
                      placeholder="0"
                      aria-label={`${row.name || 'Item'} value`}
                      className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-right font-mono text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <button type="button" onClick={() => removeRow(row.id)} aria-label="Remove row" className="flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addRow} className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                <FiPlus /> Add another
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-emerald-100 bg-emerald-50/60 px-5 py-4">
              <div>
                <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-emerald-900/50">Total</span>
                <span className="font-mono text-2xl font-semibold tabular-nums text-emerald-950">{total}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
