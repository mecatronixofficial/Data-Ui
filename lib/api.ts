import { showToast } from './toast';

const BASE = '/api';

type RequestNotifications = {
  success?: string;
  successTitle?: string;
  error?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(
  path: string,
  options: RequestInit = {},
  notifications: RequestNotifications = {},
) {
  const method = (options.method || 'GET').toUpperCase();
  const shouldNotifyError = notifications.error ?? method !== 'GET';
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch {
    const message = 'Could not reach the server. Check your connection and try again.';
    if (shouldNotifyError) {
      showToast({ message, tone: 'error', duration: 6000 });
    }
    throw new ApiError(message, 0);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await res.json();
        message = body?.message || message;
      } catch {
        // Keep the status-based fallback for malformed JSON responses.
      }
    } else {
      const text = (await res.text().catch(() => '')).trim();
      if (text.includes('FUNCTION_INVOCATION_FAILED')) {
        message = 'The backend service failed to start. Check the deployment logs.';
      } else if (text && text.length <= 300) {
        message = text;
      }
    }
    const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
    if (shouldNotifyError) {
      showToast({ message: normalizedMessage, tone: 'error', duration: 6000 });
    }
    throw new ApiError(normalizedMessage, res.status);
  }

  const contentType = res.headers.get('content-type') || '';
  let result: any = res;
  if (contentType.includes('application/json')) {
    result = await res.json();
  }
  if (notifications.success) {
    showToast({
      message: notifications.success,
      title: notifications.successTitle,
      tone: 'success',
    });
  }
  return result;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, { success: 'You are now signed in.', successTitle: 'Welcome back' }),
  logout: () => request('/auth/logout', { method: 'POST' }, { success: 'You have been signed out.' }),
  me: () => request('/auth/me'),
  updateProfile: (payload: { name?: string; email?: string }) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Your profile was updated.' }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request('/auth/me/password', { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Your password was updated.' }),

  createEntry: (payload: any) =>
    request('/entries', { method: 'POST', body: JSON.stringify(payload) }, { success: 'Team report saved. Your values will remain available.' }),
  updateEntry: (id: string, payload: any) =>
    request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Team report updated.' }),
  updateActiveEntry: (id: string, payload: any) =>
    request(`/entries/active/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Team report saved. Your values will remain available.' }),
  myEntries: () => request('/entries/me'),
  getActiveEntry: () => request('/entries/active', { cache: 'no-store' }, { error: false }),
  getEntry: (id: string) => request(`/entries/${id}`),
  allEntries: (params: {
    name?: string;
    startDate?: string;
    endDate?: string;
    scope?: 'mine' | 'team' | 'all';
    ownerRole?: 'admin' | 'user';
    teamName?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => !!v) as [string, string][],
    ).toString();
    return request(`/entries${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  },
  deleteEntry: (id: string) => request(`/entries/${id}`, { method: 'DELETE' }, { success: 'Team report removed.' }),

  listUsers: () => request('/users'),
  createUser: (payload: any) =>
    request('/users', { method: 'POST', body: JSON.stringify(payload) }, { success: `${payload?.role === 'admin' ? 'Admin' : 'User'} account created.` }),
  updateAccountProfile: (id: string, payload: { name?: string; email?: string; teamName?: string }) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Account profile updated.' }),
  resetAccountPassword: (id: string, password: string) =>
    request(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }, { success: 'Account password updated.' }),
  setAccountStatus: (id: string, isActive: boolean) =>
    request(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }, { success: `Account ${isActive ? 'activated' : 'deactivated'}.` }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }, { success: 'Account removed.' }),

  getReportSettings: () => request('/report-settings'),
  updateReportSettings: (visibleColumns: string[]) =>
    request('/report-settings', { method: 'PUT', body: JSON.stringify({ visibleColumns }) }, { success: 'Report columns saved.' }),

  getFields: () => request('/fields'),
  getFieldEditLocks: (): Promise<{ name: string; userOnlyEdit: boolean }[]> => request('/fields/edit-locks'),
  createField: (payload: { name: string; order?: number; boxNames: string[]; icon?: string; boxIcons?: string[]; boxColors?: string[]; boxFields?: BoxFieldDef[][]; userOnlyEdit?: boolean }) =>
    request('/fields', { method: 'POST', body: JSON.stringify(payload) }, { success: 'Field added.' }),
  updateField: (id: string, payload: { name: string; order?: number; boxNames: string[]; calcType?: string; groupSplit?: number; icon?: string; boxIcons?: string[]; boxColors?: string[]; boxFields?: BoxFieldDef[][]; userOnlyEdit?: boolean }) =>
    request(`/fields/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Field changes saved.' }),
  deleteField: (id: string) => request(`/fields/${id}`, { method: 'DELETE' }, { success: 'Field removed.' }),

  getFinalTotalSettings: (): Promise<{ label: string; icon: string; sign: FinalTotalSign }> => request('/fields/final-total-settings'),
  updateFinalTotalSettings: (payload: { label: string; icon?: string; sign?: FinalTotalSign }) =>
    request('/fields/final-total-settings', { method: 'PUT', body: JSON.stringify(payload) }, { success: 'Final total settings saved.' }),
};

// One inner-field column of a box's detail table (see Field.boxFields on the backend).
// 'auto' columns are computed client-side (row position, the logged-in user's name, or a
// fixed value the superadmin sets once) instead of being typed in by whoever fills the box.
// 'sumTotal' marks number column(s) that roll up into the box total. 'computed' columns
// derive their value from two other columns in the same row (matched by label) via
// `formula`, e.g. INR = USD x USD Rate, or Value = INR + INR x Bonus% / 100.
export type BoxFieldDef = {
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'computed';
  auto?: 'serial' | 'user' | 'constant';
  constant?: number;
  sumTotal?: boolean;
  // Only meaningful when sumTotal is set: 'subtract' rolls this column into the box
  // total as a negative (e.g. an "In" column that should reduce an "Out" total).
  // Defaults to 'add' when omitted.
  sumSign?: 'add' | 'subtract';
  formula?: { op: 'multiply' | 'percentAdd'; a: string; b: string };
};

// A single detail row entered inside a box: a bag of values keyed by that box's column labels.
export type BoxDetail = Record<string, string | number>;

// The operator used between field totals is a single global setting managed on the Fields page.
export type FinalTotalSign = 'add' | 'subtract';

export function blankBoxDetail(seedValue = 0): BoxDetail {
  return { name: '', value: seedValue };
}

// Fixed set of account roles. There is no admin UI to manage these on purpose.
export const ROLE_NAMES = ['user', 'admin', 'superadmin'] as const;

// Whether the current viewer may edit a field's values, given Field.userOnlyEdit:
// fields marked userOnlyEdit are locked to admins (view only); everything else is
// locked to users. Superadmin is never locked.
export function computeFieldLocked(role: string, userOnlyEdit: boolean) {
  if (role === 'admin') return userOnlyEdit;
  if (role === 'user') return !userOnlyEdit;
  return false;
}

export function exportUrl(params: {
  name?: string;
  startDate?: string;
  endDate?: string;
  scope?: 'mine' | 'team' | 'all';
  ownerRole?: 'admin' | 'user';
  teamName?: string;
}, format: 'xlsx' | 'pdf' = 'xlsx') {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString();
  const path = format === 'pdf' ? '/entries/export/pdf' : '/entries/export';
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}
