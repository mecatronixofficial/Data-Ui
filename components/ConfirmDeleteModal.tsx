'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiShieldOff, FiTrash2, FiX } from 'react-icons/fi';

export default function ConfirmDeleteModal({
  title,
  message,
  onClose,
  onConfirm,
  variant = 'remove',
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  variant?: 'remove' | 'reset-mfa';
}) {
  const [working, setWorking] = useState(false);
  const isMfaReset = variant === 'reset-mfa';

  async function handleConfirm() {
    setWorking(true);
    try {
      await onConfirm();
    } catch {
      // The API client shows the error notification.
      setWorking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="confirm-action-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !working) onClose(); }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-200/60 to-transparent" />

        <div className="flex items-start justify-between gap-4 border-b border-blue-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
              {isMfaReset ? <FiShieldOff size={17} /> : <FiAlertTriangle size={17} />}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">
                {isMfaReset ? 'Security reset' : 'Confirm removal'}
              </p>
              <h2 id="confirm-action-title" className="font-display text-xl text-blue-950">{title}</h2>
            </div>
          </div>
          <button onClick={onClose} disabled={working}
            aria-label="Close" className="rounded-lg p-1.5 text-black hover:bg-blue-50 hover:text-blue-950">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-black">{message}</p>

          <div className="mt-6 flex justify-end gap-3 border-t border-blue-100 pt-4">
            <button type="button" onClick={onClose} disabled={working}
              className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} disabled={working}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2">
                {isMfaReset ? <FiShieldOff size={14} /> : <FiTrash2 size={14} />}
                {working ? (isMfaReset ? 'Resetting...' : 'Removing...') : (isMfaReset ? 'Reset MFA' : 'Remove')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
