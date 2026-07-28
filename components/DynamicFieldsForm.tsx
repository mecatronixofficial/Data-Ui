'use client';

import { useState } from 'react';
import { FiAlertCircle, FiLock, FiRefreshCw, FiX } from 'react-icons/fi';
import TallyBox, { type BoxDetail, type BoxFieldDef } from './TallyBox';
import { type Operator } from './OperatorToggle';
import TotalPill from './TotalPill';
import { FieldIcon } from './IconPicker';
import { type FinalTotalSign } from '@/lib/api';

export type CalcType = 'grouped' | 'signed';

export type FieldValue = {
  name: string;
  icon?: string;
  boxNames: string[];
  boxIcons?: string[];
  boxColors?: string[];
  boxFields?: BoxFieldDef[][];
  boxes: number[];
  details: BoxDetail[][];
  calcType: CalcType;
  groupSplit: number;
  operator: Operator;
  // True when the current viewer isn't allowed to edit this field's values (see
  // Field.userOnlyEdit on the backend) — they can still see the totals/breakdown.
  locked?: boolean;
};

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function fieldTotal(field: FieldValue) {
  if (field.calcType === 'grouped') {
    const groupA = sum(field.boxes.slice(0, field.groupSplit));
    const groupB = sum(field.boxes.slice(field.groupSplit));
    return groupA + groupB;
  }
  return sum(field.boxes);
}

export default function DynamicFieldsForm({
  fields,
  currentUserName,
  canReset,
  onBoxChange,
  onDetailsChange,
  onResetField,
}: {
  fields: FieldValue[];
  currentUserName?: string;
  canReset?: boolean;
  onBoxChange: (fieldIndex: number, boxIndex: number, value: number) => void;
  onDetailsChange: (fieldIndex: number, boxIndex: number, details: BoxDetail[]) => void;
  onResetField?: (fieldIndex: number) => void;
}) {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  return (
    <>
      {fields.map((field, fieldIndex) => {
        const groupA = sum(field.boxes.slice(0, field.groupSplit));
        const groupB = sum(field.boxes.slice(field.groupSplit));
        const positiveTotal = sum(field.boxes.filter((v) => v > 0));
        const negativeTotal = sum(field.boxes.filter((v) => v < 0));

        return (
          <section
            key={field.name}
            className="py-2"
          >
            <div className="py-1 flex flex-row items-center justify-between">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 font-display text-[10px] text-white shadow-md shadow-blue-900/15">
                  {field.icon ? <FieldIcon icon={field.icon} size={10} /> : String(fieldIndex + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="font-display text-sm text-blue-950 inline-flex items-center gap-1.5">
                    {field.name}
                    {field.locked && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-blue-900/50">
                        <FiLock size={8} /> View only
                      </span>
                    )}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {field.calcType === 'grouped' ? (
                  <div className="flex flex-wrap items-end justify-center gap-2 py-2">
                    <TotalPill label={`Group A (1–${field.groupSplit})`} value={groupA} />
                    <span className="pb-1 font-display text-sm text-blue-700"></span>
                    <TotalPill label={`Group B (${field.groupSplit + 1}–${field.boxes.length})`} value={groupB} />
                    <span className="text-blue-900/30 font-display text-sm pb-1">=</span>
                    <TotalPill label={`${field.name} Total`} value={fieldTotal(field)} emphasize colorBySign />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end justify-center gap-2 py-2">
                    <TotalPill label="Positive total" value={positiveTotal} colorBySign />
                    <span className="pb-1 font-display text-sm text-blue-700"></span>
                    <TotalPill label="Negative total" value={negativeTotal} colorBySign />
                    <span className="text-blue-900/30 font-display text-sm pb-1">=</span>
                    <TotalPill label={`${field.name} Total`} value={fieldTotal(field)} emphasize colorBySign />
                  </div>
                )}
                {canReset && !field.locked && (
                  <button
                    type="button"
                    onClick={() => setConfirmIndex(fieldIndex)}
                    aria-label={`Reset ${field.name} values`}
                    title="Reset field values"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-900/40 transition hover:bg-amber-50 hover:text-amber-600"
                  >
                    <FiRefreshCw size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
              {field.boxes.map((val, boxIndex) => (
                <TallyBox
                  idPrefix={`field-${fieldIndex}`}
                  key={boxIndex}
                  index={boxIndex + 1}
                  name={field.boxNames[boxIndex]}
                  icon={field.boxIcons?.[boxIndex]}
                  color={field.boxColors?.[boxIndex]}
                  value={val}
                  details={field.details[boxIndex]}
                  boxFields={field.boxFields?.[boxIndex]}
                  currentUserName={currentUserName}
                  locked={field.locked}
                  onDetailsChange={(details) => onDetailsChange(fieldIndex, boxIndex, details)}
                  onChange={(v) => onBoxChange(fieldIndex, boxIndex, v)}
                />
              ))}
            </div>

          </section>
        );
      })}

      {confirmIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-field-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmIndex(null);
          }}
        >
          <div className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-white p-5 text-center shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
            <button
              type="button"
              onClick={() => setConfirmIndex(null)}
              aria-label="Close"
              className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700"
            >
              <FiX size={14} />
            </button>

            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-[0_4px_14px_rgba(0,0,0,0.10)]">
              <FiAlertCircle size={20} />
            </div>

            <h2 id="reset-field-title" className="font-display text-base text-blue-950">
              Reset {fields[confirmIndex]?.name} values?
            </h2>
            <p className="mt-2 text-xs text-blue-900/55">
              Are you sure you want to reset values? This will clear all box values for this field.
            </p>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmIndex(null)}
                className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetField?.(confirmIndex);
                  setConfirmIndex(null);
                }}
                className="flex-1 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(217,119,6,0.35)] transition hover:-translate-y-0.5"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Plain sum of every field's total, then the single global sign (superadmin-set on
// the Fields page, see FinalTotalSettings.sign) flips the whole thing if 'subtract'.
export function combinedFinalTotal(fields: FieldValue[], sign?: FinalTotalSign) {
  const rawTotal = sum(fields.map(fieldTotal));
  return sign === 'subtract' ? -rawTotal : rawTotal;
}

export function FinalTotalCard({
  fields,
  label = 'Final Total',
  icon,
  sign,
}: {
  fields: FieldValue[];
  label?: string;
  icon?: string;
  sign?: FinalTotalSign;
}) {
  const finalTotal = combinedFinalTotal(fields, sign);
  const single = fields.length <= 1;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-4 text-white shadow-[0_20px_50px_rgba(0,107,196,0.25)]">
      <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-nowrap items-center gap-2 overflow-x-auto">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 font-display text-sm text-white">
          {icon ? <FieldIcon icon={icon} size={14} /> : String(fields.length + 1).padStart(2, '0')}
        </span>
        <h2 className="shrink-0 font-display text-base">{label}</h2>

        {!single && (
          <>
            <span className="shrink-0 text-blue-50/40">·</span>
            {fields.map((field, index) => (
              <span key={index} className="flex shrink-0 items-center gap-2">
                <TotalPill label={`${field.name} Total`} value={fieldTotal(field)} dark colorBySign />
                {index < fields.length - 1 && (
                  <span className="font-display text-sm text-blue-50/70"></span>
                )}
              </span>
            ))}
          </>
        )}

        <span className="shrink-0 font-display text-sm text-blue-50/70">=</span>
        <span
          className={`shrink-0 font-mono text-2xl font-semibold tabular ${finalTotal < 0 ? 'text-red-300' : finalTotal > 0 ? 'text-blue-200' : 'text-white'
            }`}
        >
          {finalTotal}
        </span>
      </div>
    </section>
  );
}
