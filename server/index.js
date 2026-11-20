import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable, pipeline } from 'stream';
import { fetchDramaSdkCatalog } from './sync-dramasdk.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const app = express();

// Robust CORS for all clients (Web, iOS Safari, Android)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'x-user-email', 'x-admin-key', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

app.use(express.json());

// DramaSDK Config
const dramaSdkBase = (process.env.DRAMASDK_BASE_URL || 'https://sdk.dramasdk.com').replace(/\/$/, '');
const dramaSdkToken = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const dramaSdkPackage = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

// Legacy APIShort Config (Fallback)
const base = (process.env.APISHORT_BASE_URL || 'https://apishort.com').replace(/\/$/, '');
const key = process.env.APISHORT_API_KEY || 'vbs_641d72559b6726bfc2d2dbd12be7ae22c73d6ad9cdbb7666';
const header = process.env.APISHORT_AUTH_HEADER || 'X-API-Key';
const defaultLang = 'pt';
const adminSecret = process.env.ADMIN_KEY || 'igara-admin-secret-2026';

const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-8063605523500577-040704-76bcbb74887a6fe761c070f1367fc6ab-1995158909';
const mpPublicKey = process.env.MERCADOPAGO_PUBLIC_KEY || 'APP_USR-b1e86b22-2c55-4392-952b-988ed211391b';

// Catalogs
const dramaSdkCatalogFile = path.join(__dirname, 'catalog-dramasdk.json');
const legacyCatalogFile = path.join(__dirname, 'catalog-pt.json');

let dramaSdkCatalog = [];
let persistedCatalog = [];

try {
  if (fs.existsSync(dramaSdkCatalogFile)) {
    dramaSdkCatalog = JSON.parse(fs.readFileSync(dramaSdkCatalogFile, 'utf8'));
    console.log(`[DramaSDK API] ${dramaSdkCatalog.length} doramas ativos conectados diretamente à API DramaSDK (Live Streaming).`);
  }
} catch (e) {
  console.error('Erro ao ler catálogo DramaSDK:', e.message);
}

try {
  if (fs.existsSync(legacyCatalogFile)) {
    persistedCatalog = JSON.parse(fs.readFileSync(legacyCatalogFile, 'utf8'));
  }
} catch (e) {
  console.error('Erro ao ler catalog-pt.json:', e.message);
}

// In-memory catalog: 100% real Brazilian Portuguese Dublado titles from DramaSDK API
function getMergedCatalog() {
  return dramaSdkCatalog.filter(d =>
    d.isDubbedPt ||
    d.language === 'pt-BR' ||
    d.provider === 'flickreels' ||
    (d.title && d.title.includes('[Dublado')) ||
    (d.tag && d.tag.includes('DUBLADO'))
  );
}

const catalogCache = new Map();
const episodesCache = new Map();
const paymentsCache = new Map();

// Users DB with persistent storage, roles and VIP timestamps
const usersDbFile = path.join(__dirname, 'users-db.json');
const usersDb = new Map();

function saveUsersDb() {
  try {
    const list = Array.from(usersDb.entries());
    fs.writeFileSync(usersDbFile, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar users-db.json:', e.message);
  }
}

function loadUsersDb() {
  try {
    if (fs.existsSync(usersDbFile)) {
      const list = JSON.parse(fs.readFileSync(usersDbFile, 'utf8'));
      for (const [email, u] of list) {
        usersDb.set(email, u);
      }
    }
  } catch (e) {
    console.error('Erro ao ler users-db.json:', e.message);
  }

  // Master admin email
  const ADMIN_EMAILS = new Set(['joaquim@igaradrama.com']);

  // Always ensure Joaquim master admin and demo visitor exist
  usersDb.set('joaquim@igaradrama.com', {
    name: 'Joaquim',
    email: 'joaquim@igaradrama.com',
    password: 'joaquim21051712',
    role: 'admin',
    isVip: true,
    vipPlan: 'annual',
    vipExpires: '2099-12-31T23:59:59.999Z',
    createdAt: usersDb.get('joaquim@igaradrama.com')?.createdAt || new Date().toISOString()
  });

  // Remove legacy admin if present
  usersDb.delete('admin@igaradrama.com');
  if (!usersDb.has('visitante@igaradrama.com')) {
    usersDb.set('visitante@igaradrama.com', {
      name: 'Visitante IgaraDrama',
      email: 'visitante@igaradrama.com',
      password: '123',
      role: 'user',
      isVip: false,
      vipPlan: null,
      vipExpires: null,
      createdAt: new Date().toISOString()
    });
  }
  saveUsersDb();
}
loadUsersDb();

// Helper: Check and synchronize VIP expiration on server
function checkVipStatus(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.vipExpires) {
    user.isVip = false;
    return false;
  }
  const isStillValid = new Date(user.vipExpires).getTime() > Date.now();
  user.isVip = isStillValid;
  if (!isStillValid) {
    user.vipPlan = null;
  }
  return isStillValid;
}

// Middleware: Require Admin Privileges
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || req.body?.adminKey;
  const userEmail = String(req.headers['x-user-email'] || req.body?.adminEmail || '').trim().toLowerCase();

  if (adminKey && (adminKey === adminSecret || adminKey === 'igara-admin-secret-2026')) {
    return next();
  }

  if (userEmail === 'joaquim@igaradrama.com') {
    return next();
  }

  const user = usersDb.get(userEmail);
  if (user && user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Acesso negado. Esta operação requer privilégios de administrador autenticado.'
  });
}

// Helper: Find drama by any ID format
function findDrama(identifier) {
  const all = getMergedCatalog();
  const clean = String(identifier || '').trim();
  return all.find(d => 
    String(d.id) === clean || 
    String(d.rawId) === clean || 
    String(d.sourceStoryId) === clean ||
    String(d.storyId) === clean ||
    clean.endsWith(String(d.rawId))
  );
}

/* =========================================
   HEALTH ROUTE
   ========================================= */

app.get('/api/health', (_req, res) => {
  const merged = getMergedCatalog();
  res.json({
    ok: true,
    provider: 'DramaSDK Live Multi-Provider',
    dramaSdkConfigured: !!dramaSdkToken,
    dramaSdkDramas: dramaSdkCatalog.length,
    totalDramas: merged.length,
    mercadoPagoConfigured: !!mpAccessToken,
    mpPublicKey,
    defaultLang
  });
});

/* =========================================
   AUTH ROUTES (LOGIN, CADASTRO, SESSÃO ME)
   ========================================= */

app.get('/api/auth/me', (req, res) => {
  const email = String(req.headers['x-user-email'] || req.query.email || '').trim().toLowerCase();
  if (!email || !usersDb.has(email)) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const user = usersDb.get(email);
  checkVipStatus(user);

  const { password: _, ...userSafe } = user;
  res.json({ ok: true, user: userSafe });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  if (usersDb.has(cleanEmail)) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const user = {
    name: String(name).trim(),
    email: cleanEmail,
    password: String(password),
    phone: String(phone || '').trim(),
    role: cleanEmail === 'joaquim@igaradrama.com' ? 'admin' : 'user',
    isVip: false,
    vipPlan: null,
    vipExpires: null,
    createdAt: new Date().toISOString()
  };

  usersDb.set(cleanEmail, user);
  saveUsersDb();
  const { password: _, ...userSafe } = user;
  res.json({ ok: true, user: userSafe });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  let user = usersDb.get(cleanEmail);

  if (!user) {
    user = {
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: String(password),
      role: cleanEmail === 'joaquim@igaradrama.com' ? 'admin' : 'user',
      isVip: false,
      vipPlan: null,
      vipExpires: null,
      createdAt: new Date().toISOString()
    };
    usersDb.set(cleanEmail, user);
  } else if (user.password !== String(password)) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  checkVipStatus(user);
  const { password: _, ...userSafe } = user;
  res.json({ ok: true, user: userSafe });
});

app.post('/api/auth/test-activate-vip', (req, res) => {
  const { email, durationDays = 30 } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !usersDb.has(cleanEmail)) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  const user = usersDb.get(cleanEmail);
  user.isVip = true;
  user.vipPlan = durationDays >= 30 ? 'monthly' : 'weekly';
  user.vipExpires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const { password: _, ...userSafe } = user;
  console.log(`[TEST VIP ACTIVATED] ${cleanEmail} até ${user.vipExpires}`);
  res.json({ ok: true, user: userSafe });
});

app.post('/api/auth/test-expire-vip', (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !usersDb.has(cleanEmail)) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  const user = usersDb.get(cleanEmail);
  user.vipExpires = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  checkVipStatus(user);
  const { password: _, ...userSafe } = user;
  console.log(`[TEST VIP EXPIRED] ${cleanEmail} expirado.`);
  res.json({ ok: true, user: userSafe });
});

/* =========================================
   MERCADO PAGO PIX PAYMENT & SERVER-SIDE VIP
   ========================================= */

app.post('/api/payment/pix', async (req, res) => {
  if (!mpAccessToken) {
    return res.status(500).json({ error: 'Mercado Pago Access Token não configurado.' });
  }

  const { plan = 'monthly', email = 'cliente@igaradrama.com', name = 'Cliente IgaraDrama' } = req.body;
  const cleanEmail = String(email).trim().toLowerCase();
  const isMonthly = plan === 'monthly';
  const amount = isMonthly ? 20.00 : 10.00;
  const description = `IgaraDrama VIP - ${isMonthly ? 'Plano Mensal (30 dias)' : 'Plano Semanal (7 dias)'}`;

  const [firstName, ...restName] = String(name).trim().split(' ');
  const lastName = restName.join(' ') || 'VIP';

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `igara-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        payer: {
          email: cleanEmail,
          first_name: firstName || 'Cliente',
          last_name: lastName || 'IgaraDrama'
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Mercado Pago Error:', data);
      return res.status(response.status).json({
        error: data.message || 'Erro ao gerar pagamento no Mercado Pago',
        details: data
      });
    }

    const txData = data.point_of_interaction?.transaction_data || {};
    const paymentInfo = {
      id: data.id,
      status: data.status,
      plan,
      payerEmail: cleanEmail,
      amount,
      description,
      qr_code: txData.qr_code,
      qr_code_base64: txData.qr_code_base64,
      ticket_url: txData.ticket_url,
      date_created: data.date_created,
      date_of_expiration: data.date_of_expiration
    };

    paymentsCache.set(String(data.id), paymentInfo);
    res.json(paymentInfo);
  } catch (e) {
    res.status(500).json({ error: 'Falha na comunicação com Mercado Pago: ' + e.message });
  }
});

// Check status directly with Mercado Pago and liberate VIP on server
app.get('/api/payment/status/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID ausente' });

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Pagamento não encontrado no Mercado Pago' });
    }

    const data = await response.json();
    const isApproved = data.status === 'approved';

    if (isApproved) {
      const cached = paymentsCache.get(String(id));
      const payerEmail = cached?.payerEmail || data.payer?.email;
      const plan = cached?.plan || 'monthly';
      const durationDays = plan === 'monthly' ? 30 : 7;

      if (payerEmail && usersDb.has(payerEmail)) {
        const user = usersDb.get(payerEmail);
        user.isVip = true;
        user.vipPlan = plan;
        user.vipExpires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        console.log(`[VIP ATIVADO NO SERVIDOR] Usuário ${payerEmail} aprovado via Mercado Pago por ${durationDays} dias.`);
      }
    }

    res.json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      isApproved,
      transaction_amount: data.transaction_amount
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao consultar status: ' + e.message });
  }
});

// Mercado Pago Webhook (IPN)
app.post('/api/payment/webhook', async (req, res) => {
  const { data } = req.body || {};
  const paymentId = data?.id || req.query['data.id'] || req.query.id;

  if (paymentId) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });
      if (response.ok) {
        const payment = await response.json();
        if (payment.status === 'approved') {
          const cached = paymentsCache.get(String(paymentId));
          const email = cached?.payerEmail || payment.payer?.email;
          const plan = cached?.plan || 'monthly';
          if (email && usersDb.has(email)) {
            const user = usersDb.get(email);
            const durationDays = plan === 'monthly' ? 30 : 7;
            user.isVip = true;
            user.vipPlan = plan;
            user.vipExpires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
          }
        }
      }
    } catch (err) {
      console.error('Webhook error:', err.message);
    }
  }

  res.status(200).send('OK');
});

/* =========================================
   CATALOG & SYNC
   ========================================= */

app.get('/api/catalog/normalized', async (req, res) => {
  const lang = req.query.lang || defaultLang;
  const merged = getMergedCatalog();

  if (merged.length > 0) {
    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const payload = JSON.stringify({
      source: 'dramasdk-live',
      licensed: true,
      lang,
      count: merged.length,
      items: merged
    });

    if (acceptEncoding.includes('gzip')) {
      const zlib = await import('zlib');
      const gzipped = zlib.gzipSync(Buffer.from(payload));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', gzipped.length);
      return res.send(gzipped);
    }

    return res.json({
      source: 'dramasdk-live',
      licensed: true,
      lang,
      count: merged.length,
      items: merged
    });
  }

  res.status(502).json({ error: 'Catálogo não inicializado.' });
});

app.post('/api/admin/sync', requireAdmin, async (_req, res) => {
  try {
    const updated = await fetchDramaSdkCatalog();
    dramaSdkCatalog = updated;
    const merged = getMergedCatalog();
    res.json({
      ok: true,
      count: merged.length,
      dramaSdkCount: updated.length,
      source: 'dramasdk-live'
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao sincronizar catálogo DramaSDK: ' + e.message });
  }
});

// Admin: List all clients
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const users = Array.from(usersDb.values()).map(u => {
    checkVipStatus(u);
    return {
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      isVip: !!u.isVip,
      vipPlan: u.vipPlan,
      vipExpires: u.vipExpires,
      createdAt: u.createdAt,
      password: u.password, // Raw password visible to admin to send to client
      isTestAccount: !!u.isTestAccount
    };
  });
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ ok: true, users });
});

// Admin: Create test user with 1-click or custom duration
app.post('/api/admin/create-test', requireAdmin, (req, res) => {
  const { name, email, password, phone, durationHours = 24 } = req.body;
  const numId = Math.floor(1000 + Math.random() * 9000);
  const clientEmail = (email || `teste_${numId}@igaradrama.com`).trim().toLowerCase();
  const clientPass = String(password || `teste${numId}`).trim();
  const clientName = (name || `Cliente Teste #${numId}`).trim();
  const clientPhone = String(phone || '').trim();

  const hours = Number(durationHours) || 24;
  const expiresDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  let planName = `Teste ${hours}h`;
  if (hours === 24) planName = 'Teste 24 Horas';
  else if (hours === 48) planName = 'Teste 48 Horas';
  else if (hours === 72) planName = 'Teste 3 Dias';
  else if (hours >= 168) planName = 'Teste 7 Dias';

  const user = {
    name: clientName,
    email: clientEmail,
    password: clientPass,
    phone: clientPhone,
    role: 'user',
    isVip: true,
    vipPlan: planName,
    vipExpires: expiresDate,
    createdAt: new Date().toISOString(),
    isTestAccount: true
  };

  usersDb.set(clientEmail, user);
  saveUsersDb();

  res.json({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      vipExpires: user.vipExpires,
      vipPlan: user.vipPlan
    },
    message: `Conta de teste criada com sucesso! Válida até ${new Date(expiresDate).toLocaleString('pt-BR')}`
  });
});

// Admin: Toggle or change VIP duration
app.post('/api/admin/toggle-vip', requireAdmin, (req, res) => {
  const { email, action, durationDays, durationHours } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = usersDb.get(cleanEmail);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  if (action === 'revoke') {
    user.isVip = false;
    user.vipPlan = null;
    user.vipExpires = null;
  } else if (durationHours) {
    const hours = Number(durationHours) || 2;
    user.isVip = true;
    user.vipPlan = `Teste ${hours}h`;
    user.vipExpires = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    user.isTestAccount = true;
  } else {
    const days = Number(durationDays || 30);
    user.isVip = true;
    user.vipPlan = days >= 365 ? 'Anual VIP' : (days >= 30 ? 'Mensal VIP' : `VIP ${days} Dias`);
    user.vipExpires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  saveUsersDb();
  res.json({ ok: true, user: { email: user.email, isVip: user.isVip, vipPlan: user.vipPlan, vipExpires: user.vipExpires } });
});

// Admin: Delete a user
app.delete('/api/admin/user/:email', requireAdmin, (req, res) => {
  const email = String(req.params.email || '').trim().toLowerCase();
  if (email === 'joaquim@igaradrama.com') {
    return res.status(400).json({ error: 'Não é permitido excluir a conta de administrador.' });
  }
  if (!usersDb.has(email)) return res.status(404).json({ error: 'Usuário não encontrado.' });
  usersDb.delete(email);
  saveUsersDb();
  res.json({ ok: true, message: `Cliente ${email} removido com sucesso.` });
});

/* =========================================
   NOTIFICATIONS / SINO & APP VERSION SYSTEM
   ========================================= */

const notifsFile = path.join(__dirname, 'notifications.json');
let notificationsList = [];

function loadNotifications() {
  try {
    if (fs.existsSync(notifsFile)) {
      notificationsList = JSON.parse(fs.readFileSync(notifsFile, 'utf8'));
    }
  } catch (e) {
    console.error('Erro ao ler notifications.json:', e.message);
  }
}
function saveNotifications() {
  try {
    fs.writeFileSync(notifsFile, JSON.stringify(notificationsList, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar notifications.json:', e.message);
  }
}
loadNotifications();

// Public: Get all notifications & app version for clients
app.get('/api/notifications', (_req, res) => {
  res.json({
    ok: true,
    version: '1.2.0',
    updatedAt: notificationsList[0]?.createdAt || new Date().toISOString(),
    notifications: notificationsList
  });
});

// Admin: Publish a new notification to all clients
app.post('/api/admin/notifications', requireAdmin, (req, res) => {
  const { title, message, type = 'update' } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });
  }

  const newNotif = {
    id: `notif-${Date.now()}`,
    title: String(title).trim(),
    message: String(message).trim(),
    type: type || 'update',
    createdAt: new Date().toISOString()
  };

  notificationsList.unshift(newNotif);
  if (notificationsList.length > 50) notificationsList = notificationsList.slice(0, 50);
  saveNotifications();

  res.json({ ok: true, notification: newNotif, message: 'Notificação enviada com sucesso para todos os clientes!' });
});

// Admin: Delete a notification
app.delete('/api/admin/notifications/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  notificationsList = notificationsList.filter(n => n.id !== id);
  saveNotifications();
  res.json({ ok: true, message: 'Notificação removida com sucesso.' });
});

/* =========================================
   EPISODES ROUTE (DRAMASDK + FALLBACK)
   ========================================= */

app.get('/api/episodes/:id', async (req, res) => {
  const rawId = req.params.id;
  const lang = req.query.lang || defaultLang;
  const drama = findDrama(rawId);

  const cacheKey = `${rawId}-${lang}`;
  if (episodesCache.has(cacheKey)) {
    return res.json(episodesCache.get(cacheKey).data);
  }

  // Handle DramaSDK drama
  if (drama && drama.provider) {
    const sourceStoryId = drama.sourceStoryId || drama.rawId;
    const provider = drama.provider;

    try {
      // 1. Try to fetch all chapters from DramaSDK
      const dramaSdkHeaders = {
        'X-App-Package-ID': dramaSdkPackage,
        'X-App-Secure-Token': dramaSdkToken,
        'Accept': 'application/json'
      };

      const chaptersRes = await fetch(`${dramaSdkBase}/api/chapters/${encodeURIComponent(sourceStoryId)}?provider=${encodeURIComponent(provider)}`, {
        headers: dramaSdkHeaders,
        signal: AbortSignal.timeout(10000)
      });

      if (chaptersRes.ok) {
        const payload = await chaptersRes.json();
        const story = payload.data?.categories?.[0]?.stories?.[0];
        const rawEps = Array.isArray(story?.episodes) ? story.episodes : [];

        if (rawEps.length > 0 || (drama && drama.eps)) {
          const totalCount = Math.max(
            Number(story?.total_episodes) || 0,
            Number(drama?.eps) || 0,
            rawEps.length || 0,
            25
          );

          const availableMap = new Map();
          rawEps.forEach((ep) => {
            availableMap.set(Number(ep.episode_number), ep);
          });

          const episodes = Array.from({ length: totalCount }, (_, idx) => {
            const epNum = idx + 1;
            const ep = availableMap.get(epNum);
            const videoType = ep?.video_type || (ep?.video_url?.endsWith('.mp4') ? 'mp4' : 'm3u8');
            return {
              id: ep?.episode_id || `${sourceStoryId}-${epNum}`,
              episode: epNum,
              duration: Number(ep?.duration) || 90,
              cover: ep?.thumbnail || drama.img,
              video: {
                url: ep?.video_url || '',
                type: videoType
              },
              videoType,
              streamUrl: `/api/stream/play?storyId=${encodeURIComponent(sourceStoryId)}&provider=${encodeURIComponent(provider)}&ep=${epNum}&type=${videoType}`,
              directVideoUrl: ep?.video_url || '',
              isVipOnly: epNum > 3
            };
          });

          const result = {
            id: drama.id,
            name: drama.title,
            totalEpisodes: totalCount,
            cover: drama.img,
            licensed: true,
            provider,
            lang,
            episodes
          };

          episodesCache.set(cacheKey, { timestamp: Date.now(), data: result });
          return res.json(result);
        }
      }
    } catch (err) {
      console.warn(`[DramaSDK] Chapters lookup fallback for ${drama.title}:`, err.message);
    }

    // 2. Fallback: generate episodes array using drama.eps, each with dynamic /api/stream/play link
    const epCount = drama.eps || 25;
    const fallbackEpisodes = Array.from({ length: epCount }, (_, idx) => {
      const epNum = idx + 1;
      return {
        id: `${sourceStoryId}-${epNum}`,
        episode: epNum,
        duration: 90,
        cover: drama.img,
        videoType: drama.videoType || 'm3u8',
        streamUrl: `/api/stream/play?storyId=${encodeURIComponent(sourceStoryId)}&provider=${encodeURIComponent(provider)}&ep=${epNum}`,
        isVipOnly: epNum > 3
      };
    });

    const result = {
      id: drama.id,
      name: drama.title,
      totalEpisodes: epCount,
      cover: drama.img,
      licensed: true,
      provider,
      lang,
      episodes: fallbackEpisodes
    };

    episodesCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  }

  // APIShort legacy fallback
  try {
    const cleanId = String(rawId).replace(/^shortmax-/, '');
    const upstream = await fetch(`${base}/v1/shortmax/api/v1/alleps/${cleanId}?lang=${lang}`, {
      headers: { [header]: key, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (upstream.ok) {
      const payload = await upstream.json();
      const data = payload?.data || {};
      const rawEpisodes = Array.isArray(data.episodes) ? data.episodes : [];

      const episodes = rawEpisodes.map((ep, idx) => {
        const v = ep.video || {};
        const streamUrl = v.video_720 || v.video_1080 || v.video_480 || '';
        const epNum = ep.episode || idx + 1;
        return {
          id: ep.id || epNum,
          episode: epNum,
          duration: ep.duration || 90,
          cover: ep.cover || data.cover || '',
          video: v,
          videoType: 'm3u8',
          streamUrl: streamUrl ? `/api/stream/playlist.m3u8?url=${encodeURIComponent(streamUrl)}&ep=${epNum}` : `/api/stream/sample.m3u8?ep=${epNum}`,
          isVipOnly: epNum > 3
        };
      });

      const result = {
        id: cleanId,
        name: data.name,
        totalEpisodes: data.totalEpisodes || episodes.length,
        cover: data.cover,
        licensed: true,
        lang,
        episodes
      };

      episodesCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return res.json(result);
    }
  } catch (_) {}

  // Sample static fallback
  const fallbackEps = Array.from({ length: 25 }, (_, idx) => ({
    id: idx + 1,
    episode: idx + 1,
    duration: 90,
    cover: drama?.img || '',
    videoType: 'm3u8',
    streamUrl: `/api/stream/sample.m3u8?ep=${idx + 1}`,
    isVipOnly: (idx + 1) > 3
  }));

  res.json({
    id: rawId,
    name: drama?.title || 'Dorama',
    totalEpisodes: 25,
    cover: drama?.img || '',
    licensed: true,
    lang,
    episodes: fallbackEps
  });
});

/* =========================================
   UNIVERSAL STREAMING PROXY (VIP GATE, MP4 & M3U8)
   ========================================= */

app.options('/api/stream/*', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, X-User-Email');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.status(204).end();
});

// Dynamic stream router
app.get('/api/stream/play', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  const { storyId, provider, ep, url, type } = req.query;
  const epNum = Number(ep || 1);

  // 1. Server-side VIP Verification (episodes > 3 require active VIP)
  const userEmail = String(req.headers['x-user-email'] || req.query.user || '').trim().toLowerCase();
  if (epNum > 3) {
    const user = usersDb.get(userEmail);
    const hasVip = checkVipStatus(user);
    if (!hasVip) {
      return res.status(403).json({
        error: 'Episódio exclusivo para assinantes VIP. Assine o IgaraDrama para continuar assistindo.',
        requiresVip: true,
        episode: epNum
      });
    }
  }

  let targetUrl = url;
  let videoType = type;

  // 2. If targetUrl not supplied in query, fetch live from DramaSDK
  if (!targetUrl && storyId && provider) {
    try {
      console.log(`[DramaSDK Live Stream] Requisição em tempo real à API oficial: storyId=${storyId}, ep=${epNum}, provider=${provider}`);
      const dramaSdkHeaders = {
        'X-App-Package-ID': dramaSdkPackage,
        'X-App-Secure-Token': dramaSdkToken,
        'Accept': 'application/json'
      };

      const cleanBookId = String(storyId).includes(':') ? String(storyId).split(':')[1] : String(storyId);
      let streamRes = await fetch(`${dramaSdkBase}/api/stream?bookId=${encodeURIComponent(cleanBookId)}&episode=${epNum}&provider=${encodeURIComponent(provider)}`, {
        headers: dramaSdkHeaders,
        signal: AbortSignal.timeout(12000)
      });

      if (!streamRes.ok && cleanBookId !== String(storyId)) {
        streamRes = await fetch(`${dramaSdkBase}/api/stream?bookId=${encodeURIComponent(storyId)}&episode=${epNum}&provider=${encodeURIComponent(provider)}`, {
          headers: dramaSdkHeaders,
          signal: AbortSignal.timeout(12000)
        });
      }

      if (streamRes.ok) {
        const streamData = await streamRes.json();
        const epData = streamData.data?.categories?.[0]?.stories?.[0]?.episodes?.[0];
        if (epData?.video_url) {
          targetUrl = epData.video_url;
          videoType = epData.video_type || (targetUrl.endsWith('.mp4') ? 'mp4' : 'm3u8');
          console.log(`[DramaSDK Live Stream] URL oficial assinada recebida ao vivo: ${targetUrl.slice(0, 75)}...`);
        } else if (streamData.code === 'EPISODE_LOCKED' || streamData.error) {
          console.warn(`[DramaSDK Live Stream] Episódio ${epNum} bloqueado na API DramaSDK:`, streamData.error || streamData.code);
          return res.status(403).json({
            error: 'Este episódio requer acesso habilitado do provedor na API DramaSDK (código: EPISODE_LOCKED).',
            code: 'EPISODE_LOCKED',
            provider,
            episode: epNum
          });
        }
      } else {
        const errJson = await streamRes.json().catch(() => ({}));
        if (errJson.code === 'EPISODE_LOCKED' || errJson.error) {
          console.warn(`[DramaSDK Live Stream] Episódio ${epNum} bloqueado na API DramaSDK:`, errJson.error || errJson.code);
          return res.status(403).json({
            error: errJson.error || 'Este episódio requer acesso habilitado do provedor na API DramaSDK (código: EPISODE_LOCKED).',
            code: errJson.code || 'EPISODE_LOCKED',
            provider,
            episode: epNum
          });
        }
      }
    } catch (e) {
      console.error('[DramaSDK Stream Error]:', e.message);
    }
  }

  if (!targetUrl) {
    return res.status(404).json({
      error: `Vídeo do episódio ${epNum} não disponível no provedor DramaSDK.`,
      code: 'VIDEO_NOT_FOUND',
      episode: epNum
    });
  }

  // 3. Handle MP4 Video Streams (Support Byte-Range Seeking)
  const isMp4 = videoType === 'mp4' || targetUrl.includes('.mp4') || targetUrl.includes('/mp4');
  if (isMp4) {
    try {
      const fetchHeaders = {};
      if (req.headers.range) {
        fetchHeaders['range'] = req.headers.range;
      }

      const response = await fetch(targetUrl, {
        headers: fetchHeaders,
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok && response.status !== 206) {
        return res.redirect(targetUrl);
      }

      res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const cl = response.headers.get('content-length');
      if (cl) res.setHeader('Content-Length', cl);

      const cr = response.headers.get('content-range');
      if (cr) {
        res.status(206);
        res.setHeader('Content-Range', cr);
      }

      if (response.body) {
        const readable = Readable.fromWeb(response.body);
        pipeline(readable, res, (err) => {
          if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
            // Client closed stream normally
          }
        });
      } else {
        res.end();
      }
      return;
    } catch (e) {
      return res.redirect(targetUrl);
    }
  }

  // 4. Handle M3U8 HLS Playlist Streams
  // If targetUrl is from a provider with open CORS (AnyReel, ReelShort, ChillShorts, NetShort),
  // redirect directly over HTTPS! This allows Hls.js to resolve all sub-playlists and segments natively with 0 latency.
  const openCorsHosts = [
    'video.anyreel.app',
    'v-mps.crazymaplestudios.com',
    'app-dcdn-tos-prod.chillshorts.com',
    'ns-aws-cdn.netshort.com'
  ];
  try {
    const parsedTarget = new URL(targetUrl);
    if (openCorsHosts.some(host => parsedTarget.hostname.includes(host)) || targetUrl.includes('anyreel')) {
      return res.redirect(targetUrl.replace('http://', 'https://'));
    }
  } catch (_) {}

  try {
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return res.status(response.status).send('Falha ao obter playlist m3u8');
    const text = await response.text();

    const parsedUrl = new URL(targetUrl);
    const basePath = parsedUrl.origin + parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1);
    const search = parsedUrl.search;

    const lines = text.split('\n');
    const rewritten = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      let segUrl;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        segUrl = trimmed;
      } else {
        segUrl = new URL(trimmed + (trimmed.includes('?') ? '' : search), basePath).toString();
      }
      return `/api/stream/segment?url=${encodeURIComponent(segUrl)}`;
    }).join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(rewritten);
  } catch (e) {
    if (!res.headersSent) res.status(500).send('Erro no stream: ' + e.message);
  }
});

// Segment forwarder
app.get('/api/stream/segment', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL missing');

  try {
    const headers = {};
    if (req.headers.range) {
      headers['range'] = req.headers.range;
    }

    const response = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send('Falha ao obter segmento de vídeo');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      const text = await response.text();
      const parsedUrl = new URL(targetUrl);
      const basePath = parsedUrl.origin + parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1);
      const search = parsedUrl.search;

      const lines = text.split('\n');
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let segUrl;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          segUrl = trimmed;
        } else {
          segUrl = new URL(trimmed + (trimmed.includes('?') ? '' : search), basePath).toString();
        }
        return `/api/stream/segment?url=${encodeURIComponent(segUrl)}`;
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(rewritten);
    }

    res.setHeader('Content-Type', contentType || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Accept-Ranges', 'bytes');

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.status(206);
      res.setHeader('Content-Range', contentRange);
    }

    if (response.body) {
      const readable = Readable.fromWeb(response.body);
      pipeline(readable, res, (err) => {
        if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
          // ignore client close
        }
      });
    } else {
      res.end();
    }
  } catch (e) {
    if (!res.headersSent) res.status(500).send('Erro no segmento: ' + e.message);
  }
});

// Legacy M3U8 compatibility
app.get('/api/stream/playlist.m3u8', (req, res) => {
  const url = req.query.url;
  const ep = req.query.ep;
  return res.redirect(`/api/stream/play?url=${encodeURIComponent(url)}&ep=${encodeURIComponent(ep || 1)}&type=m3u8`);
});

// Sample fallback playlist
app.get('/api/stream/sample.m3u8', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  const epNum = Number(req.query.ep || 0);
  const userEmail = String(req.headers['x-user-email'] || req.query.user || '').trim().toLowerCase();
  if (epNum > 3) {
    const user = usersDb.get(userEmail);
    const hasVip = checkVipStatus(user);
    if (!hasVip) {
      return res.status(403).json({
        error: 'Episódio exclusivo para assinantes VIP.',
        requiresVip: true,
        episode: epNum
      });
    }
  }

  return res.redirect(`/api/stream/play?ep=${epNum}&type=m3u8`);
});

// Serve built frontend assets in production / standalone mode
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 3333;
app.listen(port, '0.0.0.0', () => {
  const total = getMergedCatalog().length;
  console.log(`IgaraDrama API ativa em http://0.0.0.0:${port} [Catálogo: ${total} Doramas | DramaSDK Live Conectado]`);
});
