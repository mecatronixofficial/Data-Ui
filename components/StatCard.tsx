'use client';

import type { IconType } from 'react-icons';

export type StatCardTone = 'default' | 'positive' | 'negative' | 'warning';

const TEXT_TONE: Record<StatCardTone, string> = {
  default: 'text-blue-950',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  warning: 'text-amber-600',
};

const ICON_TONE: Record<StatCardTone, string> = {
  default: 'text-blue-900',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  warning: 'text-amber-600',
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  highlight = false,
}: {
  label: string;
  value: string;
  icon: IconType;
  tone?: StatCardTone;
  highlight?: boolean;
}) {
  if (highlight) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center justify-between gap-2">
          <Icon size={18} className="text-red-500" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500/70">{label}</span>
        </div>
        <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-red-600">{value}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,107,196,0.10)]">
      <div className="flex items-center justify-between gap-2">
        <Icon size={18} className={ICON_TONE[tone]} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black">{label}</span>
      </div>
      <p className={`mt-3 font-mono text-2xl font-bold tabular-nums ${TEXT_TONE[tone]}`}>{value}</p>
    </div>
  );
}
