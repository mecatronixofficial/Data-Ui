export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastInput = {
  message: string;
  title?: string;
  tone?: ToastTone;
  duration?: number;
};

export const TOAST_EVENT = 'beone:toast';

export function showToast(input: ToastInput | string) {
  if (typeof window === 'undefined') return;
  const detail: ToastInput = typeof input === 'string'
    ? { message: input }
    : input;
  window.dispatchEvent(new CustomEvent<ToastInput>(TOAST_EVENT, { detail }));
}

export const toast = {
  success: (message: string, title?: string) => showToast({ message, title, tone: 'success' }),
  error: (message: string, title?: string) => showToast({ message, title, tone: 'error', duration: 6000 }),
  warning: (message: string, title?: string) => showToast({ message, title, tone: 'warning' }),
  info: (message: string, title?: string) => showToast({ message, title, tone: 'info' }),
};
