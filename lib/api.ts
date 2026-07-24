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
  updateUser: (id: string, payload: { password: string }) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  getReportSettings: () => request('/report-settings'),
  updateReportSettings: (visibleColumns: string[]) =>
    request('/report-settings', { method: 'PUT', body: JSON.stringify({ visibleColumns }) }),

  getFields: () => request('/fields'),
  getMyFields: () => request('/fields/mine'),
  createField: (payload: { name: string; order?: number; boxNames: string[]; roles?: string[]; icon?: string; boxIcons?: string[] }) =>
    request('/fields', { method: 'POST', body: JSON.stringify(payload) }),
  updateField: (id: string, payload: { name: string; order?: number; boxNames: string[]; roles?: string[]; calcType?: string; groupSplit?: number; icon?: string; boxIcons?: string[] }) =>
    request(`/fields/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteField: (id: string) => request(`/fields/${id}`, { method: 'DELETE' }),
};

// Fixed set of account roles. There is no admin UI to manage these on purpose.
export const ROLE_NAMES = ['user', 'admin', 'superadmin'] as const;

export function exportUrl(params: { name?: string; startDate?: string; endDate?: string }, format: 'xlsx' | 'pdf' = 'xlsx') {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString();
  const path = format === 'pdf' ? '/entries/export/pdf' : '/entries/export';
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}
