const TOKEN_KEY = 'criba.session';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Algo ha fallado.');
    this.status = status;
    this.code = body?.code;
    this.hint = body?.hint;
  }
}

let unauthorizedHandler = () => {};
export function onUnauthorized(fn) { unauthorizedHandler = fn; }

export function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (!s || !s.token || Date.now() >= s.expiresAt) return null;
    return s;
  } catch { return null; }
}

export function saveSession(token, expiresInSeconds) {
  const s = { token, expiresAt: Date.now() + expiresInSeconds * 1000 };
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  return s;
}

export function clearSession() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ }
}

export async function api(path, { method = 'GET', body, form, signal } = {}) {
  const headers = {};
  const session = readSession();
  if (session) headers.Authorization = `Bearer ${session.token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(0, { code: 'NETWORK', message: 'No hay conexión con el servidor.', hint: 'Comprueba tu conexión y vuelve a intentarlo.' });
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) {
    if (res.status === 401 && session && !path.startsWith('/auth/login')) unauthorizedHandler();
    throw new ApiError(res.status, data || { message: 'Algo ha fallado en el servidor.', hint: 'Prueba de nuevo en unos segundos.' });
  }
  return data;
}
