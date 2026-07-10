'use client';

export default function TallyBox({
  index,
  value,
  onChange,
}: {
  index: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="group flex flex-col items-center gap-1.5">
      <span className="flex h-5 min-w-5 items-center justify-center rounded bg-emerald-100 px-1.5 font-mono text-[10px] font-semibold text-emerald-700 transition group-focus-within:bg-emerald-600 group-focus-within:text-white">
        {index}
      </span>
      <input
        type="number"
        inputMode="decimal"
        aria-label={`Value ${index}`}
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        placeholder="0"
        className="h-14 w-[8rem] rounded-xl border border-emerald-100 bg-emerald-50/60 text-center font-mono text-lg font-medium tabular-nums text-emerald-950 shadow-sm outline-none transition-all placeholder:font-normal placeholder:text-emerald-900/20 hover:border-emerald-300 hover:bg-white hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:shadow-[0_10px_24px_rgba(6,78,59,0.12)] focus:ring-2 focus:ring-emerald-500/15"
      />
    </div>
  );
}
