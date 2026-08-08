'use client';

import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';

// Keep keys in sync with backend/src/fields/color-keys.ts.
export const COLORS: { key: string; label: string; hex: string }[] = [
  { key: 'red', label: 'Red', hex: '#ef4444' },
  { key: 'orange', label: 'Orange', hex: '#f97316' },
  { key: 'amber', label: 'Amber', hex: '#f59e0b' },
  { key: 'yellow', label: 'Yellow', hex: '#eab308' },
  { key: 'lime', label: 'Lime', hex: '#84cc16' },
  { key: 'green', label: 'Green', hex: '#22c55e' },
  { key: 'emerald', label: 'Emerald', hex: '#10b981' },
  { key: 'teal', label: 'Teal', hex: '#14b8a6' },
  { key: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { key: 'sky', label: 'Sky', hex: '#0ea5e9' },
  { key: 'blue', label: 'Blue', hex: '#3b82f6' },
  { key: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { key: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { key: 'purple', label: 'Purple', hex: '#a855f7' },
  { key: 'fuchsia', label: 'Fuchsia', hex: '#d946ef' },
  { key: 'pink', label: 'Pink', hex: '#ec4899' },
  { key: 'rose', label: 'Rose', hex: '#f43f5e' },
  { key: 'slate', label: 'Slate', hex: '#64748b' },
  { key: 'gray', label: 'Gray', hex: '#6b7280' },
  { key: 'zinc', label: 'Zinc', hex: '#71717a' },
  { key: 'neutral', label: 'Neutral', hex: '#737373' },
  { key: 'stone', label: 'Stone', hex: '#78716c' },
  { key: 'red-dark', label: 'Dark red', hex: '#b91c1c' },
  { key: 'orange-dark', label: 'Dark orange', hex: '#c2410c' },
  { key: 'green-dark', label: 'Dark green', hex: '#15803d' },
  { key: 'teal-dark', label: 'Dark teal', hex: '#0f766e' },
  { key: 'blue-dark', label: 'Dark blue', hex: '#1d4ed8' },
  { key: 'indigo-dark', label: 'Dark indigo', hex: '#4338ca' },
  { key: 'purple-dark', label: 'Dark purple', hex: '#7e22ce' },
  { key: 'pink-dark', label: 'Dark pink', hex: '#be185d' },
];

const COLOR_MAP = new Map(COLORS.map((entry) => [entry.key, entry.hex]));

export function boxColorHex(color?: string): string | undefined {
  return color ? COLOR_MAP.get(color) : undefined;
}

export default function ColorPicker({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: {
  value?: string;
  onChange: (color: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const dotSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const hex = boxColorHex(value);

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
        aria-label="Choose color"
        aria-expanded={open}
        aria-disabled={disabled}
        className={`flex ${dims} items-center justify-center rounded-xl bg-blue-100 transition ${disabled ? 'cursor-default opacity-70' : 'hover:bg-blue-200'}`}
      >
        {hex ? (
          <span className={`${dotSize} rounded-full border border-black/10`} style={{ backgroundColor: hex }} />
        ) : (
          <span className={`${dotSize} rounded-full border-2 border-dashed border-blue-300`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-blue-100 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-black">Choose a color</p>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                aria-label="Clear color"
                className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-black hover:bg-blue-50 hover:text-red-600"
              >
                <FiX size={11} /> Clear
              </button>
            )}
          </div>
          <div className="grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto pr-1">
            {COLORS.map(({ key, label, hex: swatch }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  value === key ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:scale-110'
                }`}
              >
                <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: swatch }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
