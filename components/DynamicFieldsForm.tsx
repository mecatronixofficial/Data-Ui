'use client';

import { Fragment, useState } from 'react';
import { FiAlertCircle, FiLock, FiRefreshCw, FiX } from 'react-icons/fi';
import TallyBox, { type BoxDetail, type BoxFieldDef } from './TallyBox';
import { type Operator } from './OperatorToggle';
import TotalPill from './TotalPill';
import { FieldIcon } from './IconPicker';
import { boxColorHex } from './ColorPicker';
import { type FinalTotalSign } from '@/lib/api';

export type CalcType = 'grouped' | 'signed';

export type FieldValue = {
  name: string;
  icon?: string;
  // Decorative accent only (the card's top stripe) — never applied to the icon itself,
  // which always keeps its own fixed color.
  color?: string;
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
  syncVersion = 0,
  currentUserName,
  canReset,
  onBoxChange,
  onDetailsChange,
  onResetField,
}: {
  fields: FieldValue[];
  syncVersion?: number;
  currentUserName?: string;
  canReset?: boolean;
  onBoxChange: (fieldIndex: number, boxIndex: number, value: number) => void;
  onDetailsChange: (fieldIndex: number, boxIndex: number, details: BoxDetail[]) => void;
  onResetField?: (fieldIndex: number) => void;
}) {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  return (
    <>
      <div className={`grid items-stretch gap-4 ${fields.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {fields.map((field, fieldIndex) => {
          const groupA = sum(field.boxes.slice(0, field.groupSplit));
          const groupB = sum(field.boxes.slice(field.groupSplit));
          const positiveTotal = sum(field.boxes.filter((v) => v > 0));
          const negativeTotal = sum(field.boxes.filter((v) => v < 0));

          const accentHex = boxColorHex(field.color);

          return (
            <section
              key={field.name}
              className="entry-field-card relative flex h-full flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_8px_28px_rgba(7,39,71,0.06)]"
            >
              {accentHex ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5" style={{ backgroundColor: accentHex }} />
              ) : (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-gradient-to-r from-blue-500 via-blue-300 to-transparent" />
              )}
              <div className="entry-field-card-header flex flex-col gap-3 border-b border-blue-100 bg-blue-50/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 w-full items-center justify-between gap-3">

                  <div className="min-w-0">
                    <h2 className="inline-flex items-center w-full gap-2 truncate font-display text-base font-semibold text-blue-950">
                      {field.icon && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-display text-xs text-blue-950">
                          <FieldIcon icon={field.icon} size={16} />
                        </span>
                      )}
                      {field.name}
                    </h2>
                  </div>
                  <div className="min-w-0">
                    <h2 className="inline-flex items-center w-full gap-2 truncate font-display text-base font-semibold text-blue-950">
                      {field.locked && (
                        <span className="entry-lock-status inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-black">
                          <FiLock size={9} /> View only
                        </span>
                      )}
                    </h2>
                  </div>
                </div>
                {canReset && !field.locked && (
                  <button
                    type="button"
                    onClick={() => setConfirmIndex(fieldIndex)}
                    aria-label={`Reset ${field.name} values`}
                    title="Reset field values"
                    className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-lg border border-transparent text-black transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 sm:self-auto"
                  >
                    <FiRefreshCw size={15} />
                  </button>
                )}
              </div>

              <div className="entry-field-card-body grid flex-1 grid-cols-2 content-start gap-2 bg-white p-3 sm:grid-cols-3 xl:grid-cols-4">
                {field.boxes.map((val, boxIndex) => (
                  <TallyBox
                    idPrefix={`field-${fieldIndex}`}
                    key={`${boxIndex}-${syncVersion}`}
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

              <div className="entry-field-card-footer flex items-center justify-end overflow-x-auto border-t border-blue-100 bg-blue-50/40 px-3 py-2 sm:px-4">
                {field.calcType === 'grouped' ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <TotalPill label="" value={groupA} />
                    <TotalPill label="" value={groupB} />
                    <span className="font-display text-sm text-black">=</span>
                    <TotalPill label="" value={fieldTotal(field)} emphasize colorBySign />
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <TotalPill label="" value={positiveTotal} colorBySign />
                    <TotalPill label="" value={negativeTotal} colorBySign />
                    <span className="font-display text-sm text-black">=</span>
                    <TotalPill label="" value={fieldTotal(field)} emphasize colorBySign />
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

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
              className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-black hover:bg-blue-50 hover:text-blue-950"
            >
              <FiX size={14} />
            </button>

            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-[0_4px_14px_rgba(0,0,0,0.10)]">
              <FiAlertCircle size={20} />
            </div>

            <h2 id="reset-field-title" className="font-display text-base text-blue-950">
              Reset {fields[confirmIndex]?.name} values?
            </h2>
            <p className="mt-2 text-xs text-black">
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

// Combine every field total using the single operator selected by the superadmin.
// The first field is the starting value; each following field is added or subtracted.
export function combinedFinalTotal(fields: FieldValue[], sign?: FinalTotalSign) {
  const totals = fields.map(fieldTotal);
  if (totals.length === 0) return 0;
  const multiplier = sign === 'subtract' ? -1 : 1;
  return totals.slice(1).reduce((total, value) => total + multiplier * value, totals[0]);
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
    <section className="entry-final-total relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_8px_28px_rgba(7,39,71,0.07)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-300 to-transparent" />

      <div className="relative flex flex-col gap-3 xl:grid xl:grid-cols-[13rem_minmax(0,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-display text-xs text-blue-950">
            {icon ? <FieldIcon icon={icon} size={15} /> : String(fields.length + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black">Summary</p>
            <h2 className="truncate font-display text-base font-semibold text-blue-950">{label}</h2>
          </div>
        </div>

        {!single && (
          <div className="scrollbar-hide flex max-w-full items-center gap-2 overflow-x-auto xl:justify-end">
            {fields.map((field, index) => (
              <Fragment key={field.name || index}>
                {index > 0 && (
                  <span className={`shrink-0 font-display text-base font-semibold ${sign === 'subtract' ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                    {sign === 'subtract' ? '−' : '+'}
                  </span>
                )}
                <TotalPill label="" value={fieldTotal(field)} colorBySign />
              </Fragment>
            ))}
          </div>
        )}

        <div className={`flex min-w-[5rem] shrink-0 items-center justify-end rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 ${single ? 'xl:col-start-3' : ''
          }`}>
          <span
            className={`font-mono text-2xl font-semibold tracking-tight tabular ${finalTotal < 0 ? 'text-red-600' : finalTotal > 0 ? 'text-blue-950' : 'text-blue-950'
              }`}
          >
            {finalTotal}
          </span>
        </div>
      </div>
    </section>
  );
}
