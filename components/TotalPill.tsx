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
        : 'bg-red-600 text-white shadow-md shadow-red-900/10'
      : value > 0
        ? dark
          ? 'border border-blue-300/40 bg-blue-400/20 text-blue-100'
          : 'bg-blue-600 text-white shadow-md shadow-blue-900/10'
        : ''
    : '';

  const defaultStyle = emphasize
    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10'
    : dark
      ? 'border border-white/15 bg-white/10 text-white'
      : 'border border-blue-100 bg-white text-blue-950';

  return (
    <div className="flex flex-col items-center">
      <span className={`mb-1 text-[10px] uppercase tracking-wider ${dark ? 'text-blue-50/60' : 'text-blue-900/45'}`}>
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
