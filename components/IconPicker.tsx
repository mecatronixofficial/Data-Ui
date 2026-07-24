'use client';

import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiClock,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiGrid,
  FiHash,
  FiHome,
  FiLayers,
  FiPercent,
  FiPieChart,
  FiRepeat,
  FiShoppingBag,
  FiSliders,
  FiTag,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';

// Keep keys in sync with backend/src/fields/icon-keys.ts.
export const ICONS: { key: string; label: string; Icon: IconType }[] = [
  { key: 'trending-up', label: 'Trending up', Icon: FiTrendingUp },
  { key: 'trending-down', label: 'Trending down', Icon: FiTrendingDown },
  { key: 'repeat', label: 'Exchange', Icon: FiRepeat },
  { key: 'dollar-sign', label: 'Dollar', Icon: FiDollarSign },
  { key: 'credit-card', label: 'Card', Icon: FiCreditCard },
  { key: 'briefcase', label: 'Briefcase', Icon: FiBriefcase },
  { key: 'clock', label: 'Clock', Icon: FiClock },
  { key: 'alert-triangle', label: 'Alert', Icon: FiAlertTriangle },
  { key: 'pie-chart', label: 'Pie chart', Icon: FiPieChart },
  { key: 'bar-chart', label: 'Bar chart', Icon: FiBarChart2 },
  { key: 'activity', label: 'Activity', Icon: FiActivity },
  { key: 'layers', label: 'Layers', Icon: FiLayers },
  { key: 'tag', label: 'Tag', Icon: FiTag },
  { key: 'shopping-bag', label: 'Shopping', Icon: FiShoppingBag },
  { key: 'percent', label: 'Percent', Icon: FiPercent },
  { key: 'database', label: 'Database', Icon: FiDatabase },
  { key: 'grid', label: 'Grid', Icon: FiGrid },
  { key: 'hash', label: 'Hash', Icon: FiHash },
  { key: 'sliders', label: 'Sliders', Icon: FiSliders },
  { key: 'home', label: 'Bank', Icon: FiHome },
];

const ICON_MAP = new Map(ICONS.map((entry) => [entry.key, entry.Icon]));

export function FieldIcon({ icon, size = 18, fallback: Fallback = FiTag }: { icon?: string; size?: number; fallback?: IconType }) {
  const Icon = (icon && ICON_MAP.get(icon)) || Fallback;
  return <Icon size={size} aria-hidden="true" />;
}

export default function IconPicker({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: {
  value?: string;
  onChange: (icon: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 14 : 18;

  useEffect(() => {
    if (!open) return;
    function onClickAway(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-label="Choose icon"
        aria-expanded={open}
        aria-disabled={disabled}
        className={`flex ${dims} items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition ${disabled ? 'cursor-default opacity-70' : 'hover:bg-blue-200'}`}
      >
        <FieldIcon icon={value} size={iconSize} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-blue-100 bg-white p-3 shadow-2xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">Choose an icon</p>
          <div className="grid grid-cols-5 gap-1.5">
            {ICONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  value === key ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
