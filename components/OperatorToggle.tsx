'use client';

export type Operator = '+' | '-' | '*' | '/';

export default function OperatorToggle({
  value,
  onChange,
}: {
  value: Operator;
  onChange: (value: Operator) => void;
}) {
  return (
    <div className="relative inline-flex shrink-0 items-center rounded-xl border border-emerald-200 bg-white p-1 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/15">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Operator)}
        className="h-9 cursor-pointer appearance-none rounded-lg bg-emerald-600 px-3 pr-8 text-center text-sm font-semibold text-white shadow-md shadow-emerald-900/15 outline-none transition hover:bg-emerald-700"
        aria-label="Calculation operator"
      >
        <option value="+">+</option>
        <option value="-">−</option>
        <option value="*">×</option>
        <option value="/">÷</option>
      </select>
      <span className="pointer-events-none absolute right-3 text-[10px] text-white/80" aria-hidden="true">
        ▼
      </span>
    </div>
  );
}
