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
  googleLogin: () => {
    window.location.assign(`${BASE}/auth/google`);
  },
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  createEntry: (payload: any) =>
    request('/entries', { method: 'POST', body: JSON.stringify(payload) }),
  updateEntry: (id: string, payload: any) =>
    request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  myEntries: () => request('/entries/me'),
  getEntry: (id: string) => request(`/entries/${id}`),
  getBoxNames: () => request('/entries/box-names'),
  updateBoxNames: (payload: { field1BoxNames: string[]; field2BoxNames: string[] }) =>
    request('/entries/box-names', { method: 'PUT', body: JSON.stringify(payload) }),
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
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
};

export function exportUrl(params: { name?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString();
  return `${BASE}/entries/export${qs ? `?${qs}` : ''}`;
}
