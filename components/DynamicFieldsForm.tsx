'use client';

import TallyBox, { type BoxDetail } from './TallyBox';
import OperatorToggle, { type Operator } from './OperatorToggle';
import TotalPill from './TotalPill';
import { FieldIcon } from './IconPicker';

export type CalcType = 'grouped' | 'signed';

export type FieldValue = {
  name: string;
  icon?: string;
  boxNames: string[];
  boxIcons?: string[];
  boxes: number[];
  details: BoxDetail[][];
  calcType: CalcType;
  groupSplit: number;
  operator: Operator;
};

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function applyOperator(a: number, b: number, op: Operator) {
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

export function fieldTotal(field: FieldValue) {
  if (field.calcType === 'grouped') {
    const groupA = sum(field.boxes.slice(0, field.groupSplit));
    const groupB = sum(field.boxes.slice(field.groupSplit));
    return applyOperator(groupA, groupB, field.operator);
  }
  return sum(field.boxes);
}

export default function DynamicFieldsForm({
  fields,
  onBoxChange,
  onDetailsChange,
  onOperatorChange,
}: {
  fields: FieldValue[];
  onBoxChange: (fieldIndex: number, boxIndex: number, value: number) => void;
  onDetailsChange: (fieldIndex: number, boxIndex: number, details: BoxDetail[]) => void;
  onOperatorChange: (fieldIndex: number, op: Operator) => void;
}) {
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
            className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-display text-lg text-white shadow-md shadow-blue-900/15">
                {field.icon ? <FieldIcon icon={field.icon} size={19} /> : String(fieldIndex + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="font-display text-xl text-blue-950">{field.name}</h2>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {field.boxes.map((val, boxIndex) => (
                <TallyBox
                  idPrefix={`field-${fieldIndex}`}
                  key={boxIndex}
                  index={boxIndex + 1}
                  name={field.boxNames[boxIndex]}
                  icon={field.boxIcons?.[boxIndex]}
                  value={val}
                  details={field.details[boxIndex]}
                  onDetailsChange={(details) => onDetailsChange(fieldIndex, boxIndex, details)}
                  onChange={(v) => onBoxChange(fieldIndex, boxIndex, v)}
                />
              ))}
            </div>

            {field.calcType === 'grouped' ? (
              <div className="flex flex-wrap items-end justify-center gap-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
                <TotalPill label={`Group A (1–${field.groupSplit})`} value={groupA} />
                <OperatorToggle value={field.operator} onChange={(op) => onOperatorChange(fieldIndex, op)} />
                <TotalPill label={`Group B (${field.groupSplit + 1}–${field.boxes.length})`} value={groupB} />
                <span className="text-blue-900/30 font-display text-xl pb-2">=</span>
                <TotalPill label={`${field.name} Total`} value={fieldTotal(field)} emphasize colorBySign />
              </div>
            ) : (
              <div className="flex flex-wrap items-end justify-center gap-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
                <TotalPill label="Positive total" value={positiveTotal} colorBySign />
                <span className="pb-2 font-display text-xl text-blue-700">+</span>
                <TotalPill label="Negative total" value={negativeTotal} colorBySign />
                <span className="text-blue-900/30 font-display text-xl pb-2">=</span>
                <TotalPill label={`${field.name} Total`} value={fieldTotal(field)} emphasize colorBySign />
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

export function FinalTotalCard({
  fieldNames,
  fieldTotals,
}: {
  fieldNames: string[];
  fieldTotals: number[];
}) {
  const finalTotal = sum(fieldTotals);
  const single = fieldTotals.length <= 1;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-6 text-white shadow-[0_20px_50px_rgba(0,107,196,0.25)]">
      <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 font-display text-lg text-white">
          {String(fieldTotals.length + 1).padStart(2, '0')}
        </span>
        <div>
          <h2 className="font-display text-xl">Final Total</h2>
        </div>
      </div>

      {!single && (
        <div className="relative flex flex-wrap items-end justify-center gap-4 py-2">
          {fieldTotals.map((total, index) => (
            <span key={index} className="flex items-end gap-4">
              <TotalPill label={`${fieldNames[index]} Total`} value={total} dark colorBySign />
              {index < fieldTotals.length - 1 && (
                <span className="pb-2 font-display text-xl text-blue-50/70">+</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-5 flex items-center justify-between border-t border-dashed border-white/20 pt-5">
        <span className="text-xs uppercase tracking-widest text-blue-50/60">Final Total</span>
        <span
          className={`font-mono text-4xl font-semibold tabular ${
            finalTotal < 0 ? 'text-red-300' : finalTotal > 0 ? 'text-blue-200' : 'text-white'
          }`}
        >
          {finalTotal}
        </span>
      </div>
    </section>
  );
}
