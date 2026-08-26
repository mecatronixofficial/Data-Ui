'use client';

export default function TotalPill({
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
        : 'border border-red-200 bg-red-50 text-red-700'
      : value > 0
        ? dark
          ? 'border border-blue-300/40 bg-blue-400/20 text-blue-100'
          : 'border border-blue-200 bg-blue-50 text-blue-950'
        : ''
    : '';

  const defaultStyle = emphasize
    ? 'border border-blue-200 bg-blue-100 text-blue-800'
    : dark
      ? 'border border-white/15 bg-white/10 text-white'
      : 'border border-blue-100 bg-white text-blue-950';

  return (
    <div className="flex min-w-[4.5rem] flex-col gap-1">
      {label && (
        <span className={`truncate text-[8px] font-semibold uppercase tracking-[0.12em] ${
          dark ? 'text-blue-100/55' : 'text-black'
        }`}>
          {label}
        </span>
      )}
      <span
        className={`entry-number-value rounded-lg px-2 py-1 text-center font-mono text-xs font-semibold tabular shadow-sm ${signStyle || defaultStyle}`}
      >
        {value}
      </span>
    </div>
  );
}
