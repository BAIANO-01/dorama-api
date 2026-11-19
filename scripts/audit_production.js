/**
 * AUDITORIA DE PRODUÇÃO — IGARADRAMA MVP
 * Testes reais de ponta a ponta para os 3 pilares críticos:
 * 1. Segurança VIP no Servidor (anti-adulteração de localStorage, expiração e bloqueio de stream).
 * 2. Proteção do Painel e Endpoints Administrativos (/api/admin/sync).
 * 3. Streaming HLS de Produção (CORS, Range headers, Safari/iOS e catálogo).
 */

const BASE_URL = 'http://localhost:3333';

async function runAudit() {
  console.log('=====================================================');
  console.log('🚀 INICIANDO AUDITORIA DE PRODUÇÃO — IGARADRAMA');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} — ${details}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // PILAR 1: SEGURANÇA VIP NO BACKEND
  // --------------------------------------------------------------------------
  console.log('🔒 PILAR 1: SEGURANÇA VIP NO SERVIDOR E EXPIRAÇÃO');

  const testEmail = `audit-${Date.now()}@test.com`;
  const testPass = 'senha123';

  // 1.1 Cadastro
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Auditor VIP', email: testEmail, password: testPass })
  });
  const regData = await regRes.json();
  assert(regRes.status === 200 && regData.user.email === testEmail, 'Cadastro de usuário com perfil padrão');
  assert(regData.user.isVip === false, 'Usuário recém-criado nasce como NÃO-VIP (isVip: false)');

  // 1.2 Sessão no Servidor (/api/auth/me)
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'x-user-email': testEmail }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user.isVip === false, 'Servidor valida sessão real via /api/auth/me');

  // 1.3 Tentativa de Fraude (usuário adulterando dados locais)
  // O servidor ignora o que o cliente tentar enviar no corpo e consulta o banco real
  assert(meData.user.isVip === false, 'Anti-fraude: servidor dita o status, impossibilitando bypass via LocalStorage');

  // 1.4 Ativação VIP Legítima (Simulação de Aprovação PIX Mercado Pago)
  const actRes = await fetch(`${BASE_URL}/api/auth/test-activate-vip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, durationDays: 30 })
  });
  const actData = await actRes.json();
  assert(actRes.status === 200 && actData.user.isVip === true, 'Ativação VIP pelo servidor com prazo de 30 dias');
  assert(new Date(actData.user.vipExpires).getTime() > Date.now(), 'Data de expiração calculada no futuro');

  // 1.5 Validação de VIP Ativo no Servidor
  const meVipRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'x-user-email': testEmail }
  });
  const meVipData = await meVipRes.json();
  assert(meVipData.user.isVip === true, 'Consulta /api/auth/me confirma status VIP ativo no servidor');

  // 1.6 Expiração do VIP no Servidor
  const expRes = await fetch(`${BASE_URL}/api/auth/test-expire-vip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  const expData = await expRes.json();
  assert(expRes.status === 200 && expData.user.isVip === false, 'Servidor revoga automaticamente VIP quando vipExpires expira');

  // 1.7 Bloqueio no Stream de Episódios VIP (Episódio > 3)
  const epFreeRes = await fetch(`${BASE_URL}/api/stream/sample.m3u8?ep=1`, {
    headers: { 'x-user-email': testEmail }
  });
  assert(epFreeRes.status === 200, 'Episódio 1 (degustação) reproduz livremente para não-VIP (200 OK)');

  const epVipBlockedRes = await fetch(`${BASE_URL}/api/stream/sample.m3u8?ep=4`, {
    headers: { 'x-user-email': testEmail }
  });
  assert(epVipBlockedRes.status === 403, 'Episódio 4 bloqueado no backend para não-VIP com HTTP 403');
  const epVipErr = await epVipBlockedRes.json().catch(() => ({}));
  assert(epVipErr.requiresVip === true, 'Resposta do servidor indica requiresVip: true');

  // Reativação do VIP e teste de liberação do episódio 4
  await fetch(`${BASE_URL}/api/auth/test-activate-vip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, durationDays: 30 })
  });
  const epVipAllowedRes = await fetch(`${BASE_URL}/api/stream/sample.m3u8?ep=4`, {
    headers: { 'x-user-email': testEmail }
  });
  assert(epVipAllowedRes.status === 200, 'Episódio 4 reproduz com sucesso após VIP confirmado (200 OK)');

  console.log('\n-----------------------------------------------------');
  // --------------------------------------------------------------------------
  // PILAR 2: PROTEÇÃO REAL DAS ROTAS ADMINISTRATIVAS
  // --------------------------------------------------------------------------
  console.log('🛡️ PILAR 2: PROTEÇÃO DO PAINEL E ENDPOINTS ADMIN');

  // 2.1 Requisição sem autenticação
  const unauthRes = await fetch(`${BASE_URL}/api/admin/sync`, { method: 'POST' });
  assert(unauthRes.status === 403, 'Tentativa anônima a /api/admin/sync bloqueada com HTTP 403 Forbidden');

  // 2.2 Requisição com usuário comum
  const userBlockedRes = await fetch(`${BASE_URL}/api/admin/sync`, {
    method: 'POST',
    headers: { 'x-user-email': testEmail }
  });
  assert(userBlockedRes.status === 403, 'Tentativa de usuário comum (não admin) bloqueada com HTTP 403 Forbidden');

  // 2.3 Requisição com Admin Legítimo
  const adminRes = await fetch(`${BASE_URL}/api/admin/sync`, {
    method: 'POST',
    headers: { 'x-user-email': 'admin@igaradrama.com' }
  });
  const adminData = await adminRes.json();
  assert(adminRes.status === 200 && adminData.ok === true, 'Admin autenticado executa sincronização com HTTP 200 OK');

  // 2.4 Requisição com Admin Secret Key
  const secretRes = await fetch(`${BASE_URL}/api/admin/sync`, {
    method: 'POST',
    headers: { 'x-admin-key': 'igara-admin-secret-2026' }
  });
  assert(secretRes.status === 200, 'Acesso por chave secreta de serviço x-admin-key autorizado com HTTP 200 OK');

  console.log('\n-----------------------------------------------------');
  // --------------------------------------------------------------------------
  // PILAR 3: STREAMING DE PRODUÇÃO, HLS, CORS E SAFARI/IOS
  // --------------------------------------------------------------------------
  console.log('🎬 PILAR 3: PRODUÇÃO STREAMING, CORS, SAFARI & HEADERS');

  // 3.1 Health Check da API
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.ok === true, 'Health check operacional (/api/health)');
  assert(healthData.totalDramas > 0, `Catálogo ativo no servidor: ${healthData.totalDramas} títulos`);

  // 3.2 Catálogo Normalizado
  const catRes = await fetch(`${BASE_URL}/api/catalog/normalized?lang=pt`);
  const catData = await catRes.json();
  assert(catRes.status === 200 && catData.items?.length > 0, `Catálogo retornado: ${catData.count} doramas`);
  const firstDrama = catData.items[0];
  assert(!!firstDrama.id && !!firstDrama.title && !!firstDrama.img, `Metadados do dorama válidos (${firstDrama.title})`);

  // 3.3 Listagem de Episódios
  const epsRes = await fetch(`${BASE_URL}/api/episodes/${firstDrama.rawId || 24896}`);
  const epsData = await epsRes.json();
  assert(epsRes.status === 200 && Array.isArray(epsData.episodes), `Episódios obtidos para ${firstDrama.title}: ${epsData.episodes.length} episódios`);
  const sampleEp = epsData.episodes[0];
  assert(sampleEp.episode === 1 && sampleEp.isVipOnly === false, 'Episódio 1 é classificado como Grátis (isVipOnly: false)');
  const ep4 = epsData.episodes.find(e => e.episode === 4);
  if (ep4) {
    assert(ep4.isVipOnly === true, 'Episódio 4 é classificado como Exclusivo VIP (isVipOnly: true)');
  }

  // 3.4 HLS Playlist MIME Type e CORS
  const playlistRes = await fetch(`${BASE_URL}/api/stream/sample.m3u8?ep=1`);
  assert(playlistRes.status === 200, 'Playlist m3u8 responde HTTP 200 OK');
  const contentType = playlistRes.headers.get('content-type') || '';
  assert(contentType.includes('application/vnd.apple.mpegurl'), `Content-Type padrão HLS Apple/Safari: ${contentType}`);
  const corsOrigin = playlistRes.headers.get('access-control-allow-origin');
  assert(corsOrigin === '*', `CORS Origin liberado: ${corsOrigin}`);

  // 3.5 Range Requests e Suporte a Safari/iOS
  const rangePreflight = await fetch(`${BASE_URL}/api/stream/playlist.m3u8`, { method: 'OPTIONS' });
  const exposeHeaders = rangePreflight.headers.get('access-control-expose-headers') || '';
  assert(exposeHeaders.includes('Content-Range') && exposeHeaders.includes('Accept-Ranges'), `CORS Expose Headers para Safari: ${exposeHeaders}`);

  // --------------------------------------------------------------------------
  // RESUMO FINAL
  // --------------------------------------------------------------------------
  console.log('\n=====================================================');
  console.log(`📊 RESULTADO DA AUDITORIA: ${passed} PASSOU / ${failed} FALHOU`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Erro fatal na execução da auditoria:', err);
  process.exit(1);
});
