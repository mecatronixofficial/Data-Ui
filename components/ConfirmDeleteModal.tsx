'use client';

import { useState } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';

export default function ConfirmDeleteModal({
  title,
  message,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setError('');
    setDeleting(true);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Could not complete this action');
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) onClose(); }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-200/60 to-transparent" />

        <div className="flex items-start justify-between gap-4 border-b border-blue-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <FiAlertTriangle size={17} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">Confirm removal</p>
              <h2 id="confirm-delete-title" className="font-display text-xl text-blue-950">{title}</h2>
            </div>
          </div>
          <button onClick={onClose} disabled={deleting}
            aria-label="Close" className="rounded-lg p-1.5 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-blue-900/70">{message}</p>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <FiAlertCircle size={13} />{error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-blue-100 pt-4">
            <button type="button" onClick={onClose} disabled={deleting}
              className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} disabled={deleting}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <span className="relative flex items-center gap-2">
                <FiTrash2 size={14} />
                {deleting ? 'Removing…' : 'Remove'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
