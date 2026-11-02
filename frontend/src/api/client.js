// Klien HTTP tunggal untuk seluruh aplikasi.
// Backend membalas { success, message, data } dan error { success:false, message, errors? }.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'rosalina_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.status = status;
    this.errors = Array.isArray(errors) ? errors : [];
  }
}

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function request(method, path, { body, params, raw = false, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}${qs(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
  }

  if (raw && res.ok) return res; // untuk unduhan file (PDF / XLSX)

  let json = null;
  try { json = await res.json(); } catch { /* respons bukan JSON */ }

  if (!res.ok || (json && json.success === false)) {
    // Token kedaluwarsa / tidak valid -> paksa login ulang (kecuali saat proses login itu sendiri)
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
    throw new ApiError(json?.message || `Permintaan gagal (${res.status})`, res.status, json?.errors);
  }
  return json ? json.data : null;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
  login: (username, password) => request('POST', '/auth/login', { body: { username, password }, auth: false }),
  async download(path, params) {
    const res = await request('GET', path, { params, raw: true });
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || '';
    const m = cd.match(/filename="?([^";]+)"?/i);
    return { blob, filename: m ? m[1] : null };
  },
};
