const BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // ignore
    }
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateProfile: (payload: { name?: string; email?: string }) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request('/auth/me/password', { method: 'PUT', body: JSON.stringify(payload) }),

  createEntry: (payload: any) =>
    request('/entries', { method: 'POST', body: JSON.stringify(payload) }),
  updateEntry: (id: string, payload: any) =>
    request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  myEntries: () => request('/entries/me'),
  getEntry: (id: string) => request(`/entries/${id}`),
  allEntries: (params: { name?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => !!v) as [string, string][],
    ).toString();
    return request(`/entries${qs ? `?${qs}` : ''}`);
  },
  deleteEntry: (id: string) => request(`/entries/${id}`, { method: 'DELETE' }),

  listUsers: () => request('/users'),
  createUser: (payload: any) =>
    request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateAccountProfile: (id: string, payload: { name?: string; email?: string }) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetAccountPassword: (id: string, password: string) =>
    request(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  setAccountStatus: (id: string, isActive: boolean) =>
    request(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  getReportSettings: () => request('/report-settings'),
  updateReportSettings: (visibleColumns: string[]) =>
    request('/report-settings', { method: 'PUT', body: JSON.stringify({ visibleColumns }) }),

  getFields: () => request('/fields'),
  getMyFields: () => request('/fields/mine'),
  getFieldEditLocks: (): Promise<{ name: string; userOnlyEdit: boolean }[]> => request('/fields/edit-locks'),
  createField: (payload: { name: string; order?: number; boxNames: string[]; icon?: string; boxIcons?: string[]; boxColors?: string[]; boxFields?: BoxFieldDef[][]; visibleUserIds?: string[]; userOnlyEdit?: boolean }) =>
    request('/fields', { method: 'POST', body: JSON.stringify(payload) }),
  updateField: (id: string, payload: { name: string; order?: number; boxNames: string[]; calcType?: string; groupSplit?: number; icon?: string; boxIcons?: string[]; boxColors?: string[]; boxFields?: BoxFieldDef[][]; visibleUserIds?: string[]; userOnlyEdit?: boolean }) =>
    request(`/fields/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteField: (id: string) => request(`/fields/${id}`, { method: 'DELETE' }),

  getFinalTotalSettings: (): Promise<{ label: string; icon: string; sign: FinalTotalSign }> => request('/fields/final-total-settings'),
  updateFinalTotalSettings: (payload: { label: string; icon?: string; sign?: FinalTotalSign }) =>
    request('/fields/final-total-settings', { method: 'PUT', body: JSON.stringify(payload) }),
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

// Whether the overall Final Total is shown/stored as a positive or negative value —
// a single global toggle set on the Fields page (see FinalTotalSettings.sign on the backend).
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

export function exportUrl(params: { name?: string; startDate?: string; endDate?: string }, format: 'xlsx' | 'pdf' = 'xlsx') {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString();
  const path = format === 'pdf' ? '/entries/export/pdf' : '/entries/export';
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}
