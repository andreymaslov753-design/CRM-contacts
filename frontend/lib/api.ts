const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    throw new Error('Сессия истекла');
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(err.detail || 'Ошибка запроса');
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Contacts
  getContacts: (params?: { q?: string; category_id?: number; tag?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.category_id) searchParams.set('category_id', String(params.category_id));
    if (params?.tag) searchParams.set('tag', params.tag);
    const qs = searchParams.toString();
    return apiFetch(`/api/contacts${qs ? '?' + qs : ''}`);
  },
  getContact: (id: number) => apiFetch(`/api/contacts/${id}`),
  createContact: (data: any) => apiFetch('/api/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: number, data: any) => apiFetch(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id: number) => apiFetch(`/api/contacts/${id}`, { method: 'DELETE' }),

  // Tags
  addTags: (contactId: number, tags: string[]) =>
    apiFetch(`/api/contacts/${contactId}/tags`, { method: 'POST', body: JSON.stringify({ tags }) }),
  removeTag: (contactId: number, tag: string) =>
    apiFetch(`/api/contacts/${contactId}/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' }),
  getAllTags: () => apiFetch('/api/contacts/meta/tags'),

  // Categories
  getCategories: () => apiFetch('/api/categories'),
  createCategory: (data: any) => apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) => apiFetch(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: number) => apiFetch(`/api/categories/${id}`, { method: 'DELETE' }),

  // Reminders
  getReminders: (filter?: string) => apiFetch(`/api/reminders${filter ? '?filter=' + filter : ''}`),
  createReminder: (contactId: number, data: any) =>
    apiFetch(`/api/contacts/${contactId}/reminders`, { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id: number, data: any) => apiFetch(`/api/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markReminderDone: (id: number) => apiFetch(`/api/reminders/${id}/done`, { method: 'PATCH' }),
  deleteReminder: (id: number) => apiFetch(`/api/reminders/${id}`, { method: 'DELETE' }),

  // Timeline
  getTimeline: (contactId: number) => apiFetch(`/api/contacts/${contactId}/timeline`),

  // Sync
  triggerGoogleSync: () => apiFetch('/api/sync/google/trigger', { method: 'POST' }),
};
