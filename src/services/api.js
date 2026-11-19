/* =========================================
   IGARADRAMA — API SERVICE LAYER
   ========================================= */

const isNativeApp = typeof window !== 'undefined' && (
  window.Capacitor?.isNativePlatform?.() ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && !window.location.port)
);

const CLOUD_API = 'https://dorama-api.onrender.com/api';
const API_BASE = isNativeApp ? CLOUD_API : (import.meta.env.VITE_API_URL || '/api');

/** Verifica status do backend */
export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

/** Verifica sessão e status VIP do usuário no servidor */
export async function fetchMe(email) {
  if (!email) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

/** Busca catálogo normalizado completo */
export async function fetchCatalog(lang = 'pt') {
  const res = await fetch(`${API_BASE}/catalog/normalized?lang=${lang}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao carregar catálogo');
  }
  const data = await res.json();
  return data;
}

/** Busca catálogo raw (usado na sync do admin) */
export async function fetchCatalogRaw(lang = 'pt') {
  const res = await fetch(`${API_BASE}/catalog?lang=${lang}`);
  return res.json();
}

/** Sincronização protegida de catálogo com verificação admin */
export async function syncAdminCatalog(email, adminKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (email) headers['x-user-email'] = email;
  if (adminKey) headers['x-admin-key'] = adminKey;

  const res = await fetch(`${API_BASE}/admin/sync`, {
    method: 'POST',
    headers
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha na sincronização administrativa');
  }
  return data;
}

/** Gerenciamento de Usuários e Clientes no Admin */
export async function fetchAdminUsers(userEmail, adminKey) {
  const headers = {};
  if (userEmail) headers['x-user-email'] = userEmail;
  if (adminKey) headers['x-admin-key'] = adminKey;
  const res = await fetch(`${API_BASE}/admin/users`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao carregar clientes');
  }
  return res.json();
}

export async function createAdminTestUser(userEmail, data, adminKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (userEmail) headers['x-user-email'] = userEmail;
  if (adminKey) headers['x-admin-key'] = adminKey;
  const res = await fetch(`${API_BASE}/admin/create-test`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar teste');
  }
  return res.json();
}

export async function toggleAdminUserVip(userEmail, targetEmail, action, durationDays, durationHours, adminKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (userEmail) headers['x-user-email'] = userEmail;
  if (adminKey) headers['x-admin-key'] = adminKey;
  const res = await fetch(`${API_BASE}/admin/toggle-vip`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: targetEmail, action, durationDays, durationHours })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar VIP');
  }
  return res.json();
}

export async function deleteAdminUser(userEmail, targetEmail, adminKey) {
  const headers = {};
  if (userEmail) headers['x-user-email'] = userEmail;
  if (adminKey) headers['x-admin-key'] = adminKey;
  const res = await fetch(`${API_BASE}/admin/user/${encodeURIComponent(targetEmail)}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao excluir usuário');
  }
  return res.json();
}

/** Busca episódios de uma série */
export async function fetchEpisodes(rawId, lang = 'pt') {
  const cleanId = String(rawId).replace(/^shortmax-/, '');
  const res = await fetch(`${API_BASE}/episodes/${cleanId}?lang=${lang}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao carregar episódios');
  }
  return res.json();
}

/** Login */
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na autenticação');
  return data;
}

/** Cadastro */
export async function register(name, email, password, phone) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
  return data;
}

/** Gerar pagamento PIX */
export async function createPixPayment(plan, email, name) {
  const res = await fetch(`${API_BASE}/payment/pix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, email, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao gerar cobrança');
  return data;
}

/** Consultar status de pagamento e validar liberação no servidor */
export async function checkPaymentStatus(paymentId) {
  const res = await fetch(`${API_BASE}/payment/status/${paymentId}`);
  return res.json();
}
