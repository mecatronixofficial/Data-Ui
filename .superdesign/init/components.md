# Shared components

## `components/TotalPill.tsx` — TotalPill
Compact signed numeric value used by entry totals.

```tsx
'use client';
export default function TotalPill({ label, value, emphasize, dark, colorBySign }: { label: string; value: number; emphasize?: boolean; dark?: boolean; colorBySign?: boolean }) {
  const signStyle = colorBySign ? value < 0 ? dark ? 'border border-red-300/40 bg-red-500/20 text-red-200' : 'border border-red-200 bg-red-50 text-red-700' : value > 0 ? dark ? 'border border-blue-300/40 bg-blue-400/20 text-blue-100' : 'border border-blue-200 bg-blue-50 text-blue-950' : '' : '';
  const defaultStyle = emphasize ? 'border border-blue-200 bg-blue-100 text-blue-800' : dark ? 'border border-white/15 bg-white/10 text-white' : 'border border-blue-100 bg-white text-blue-950';
  return <div className="flex min-w-[4.5rem] flex-col gap-1">{label && <span className={`truncate text-[8px] font-semibold uppercase tracking-[0.12em] ${dark ? 'text-blue-100/55' : 'text-black'}`}>{label}</span>}<span className={`entry-number-value rounded-lg px-2 py-1 text-center font-mono text-xs font-semibold tabular shadow-sm ${signStyle || defaultStyle}`}>{value}</span></div>;
}
```

## `components/OperatorToggle.tsx` — OperatorToggle
Accessible add/subtract selector.

```tsx
'use client';
export type Operator = '+' | '-';
export default function OperatorToggle({ value, onChange }: { value: Operator; onChange: (value: Operator) => void }) {
  return <div className="relative inline-flex shrink-0 items-center rounded-xl border border-blue-200 bg-white p-1 shadow-sm"><select value={value} onChange={(event) => onChange(event.target.value as Operator)} className="h-9 cursor-pointer appearance-none rounded-lg bg-blue-600 px-3 pr-8 text-center text-sm font-semibold text-white" aria-label="Calculation operator"><option value="+">+</option><option value="-">−</option></select><span className="pointer-events-none absolute right-3 text-[10px] text-white/80" aria-hidden="true">▼</span></div>;
}
```

## Other shared UI

- `StatCard.tsx`: metric card with default, positive, negative, warning and highlighted states.
- `ConfirmDeleteModal.tsx`: accessible destructive-action confirmation dialog.
- `EditAccountModal.tsx`: account profile editor dialog.
- `ResetPasswordModal.tsx`: password reset dialog.
- `ToastProvider.tsx`: global, timed, accessible toast viewport.
- `DynamicFieldsForm.tsx`, `TallyBox.tsx`: production entry grid and detail editor.
- `IconPicker.tsx`, `ColorPicker.tsx`: field configuration controls.

The complete implementations remain the authoritative source files above; target design calls include those files directly.
