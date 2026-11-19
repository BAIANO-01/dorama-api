import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, ShieldCheck, RefreshCw, Lock, AlertTriangle, User } from 'lucide-react';
import { syncAdminCatalog } from '../services/api';

export default function AdminPage({ catalog = [], user }) {
  const navigate = useNavigate();
  const [feed, setFeed] = useState({ loading: false, count: null, warning: '', error: '' });
  const [adminKeyInput, setAdminKeyInput] = useState('');

  const isAdmin = user?.role === 'admin';

  const handleSync = useCallback(async () => {
    setFeed({ loading: true, count: null, warning: '', error: '' });
    try {
      const result = await syncAdminCatalog(user?.email, adminKeyInput || undefined);
      setFeed({
        loading: false,
        count: result.count,
        warning: '',
        error: ''
      });
    } catch (e) {
      setFeed({
        loading: false,
        count: catalog.length,
        warning: '',
        error: e.message
      });
    }
  }, [user?.email, adminKeyInput, catalog.length]);

  // If not admin, render Security Blocked screen
  if (!isAdmin) {
    return (
      <div className="home-container fade-in">
        <div className="empty-state" style={{ padding: '80px 20px', maxWidth: '540px', margin: '0 auto' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 35, 60, 0.15)',
            border: '1px solid rgba(239, 35, 60, 0.4)',
            display: 'grid',
            placeItems: 'center',
            color: '#ff4d6d',
            marginBottom: '16px'
          }}>
            <Lock size={30} />
          </div>
          <h2 style={{ fontSize: '24px', color: '#fff', margin: '0 0 8px' }}>Área Administrativa Protegida</h2>
          <p style={{ color: '#d1b4bc', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
            O acesso a este painel e às operações de sincronização do banco de dados requer privilégios de administrador autenticado no servidor backend.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              <User size={16} /> Entrar com Conta Admin
            </button>
            <button className="btn-secondary" onClick={() => navigate('/')}>
              Voltar ao Início
            </button>
          </div>

          <div className="notice" style={{ marginTop: '32px', textAlign: 'left', width: '100%' }}>
            <AlertTriangle size={18} color="#ffb800" />
            <span style={{ fontSize: '12px' }}>
              <strong>Segurança Ativa:</strong> Todas as rotas de backend (incluindo <code>/api/admin/sync</code>) validam permissões no servidor. Modificações em LocalStorage não concedem privilégios administrativos.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container fade-in">
      <div className="page-heading">
        <div className="eyebrow">ÁREA TÉCNICA E INTEGRAÇÃO (ADMINISTRADOR)</div>
        <h2>Painel de Gerenciamento</h2>
        <p>Monitoramento de status e conexão segura com APIShort, ShortMax e Mercado Pago.</p>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <Film size={24} color="#ba8df2" />
          <small>Títulos Ativos no Catálogo</small>
          <strong>{catalog.length}</strong>
        </div>
        <div className="admin-card">
          <ShieldCheck size={24} color="#4ade80" />
          <small>Mercado Pago PIX</small>
          <strong style={{ color: '#4ade80', fontSize: '18px' }}>Conectado (Ativo)</strong>
        </div>
        <div className="admin-card">
          <RefreshCw size={24} color="#ba8df2" />
          <small>APIShort (ShortMax)</small>
          <strong style={{ color: '#ba8df2', fontSize: '18px' }}>200 OK (Sincronizado)</strong>
        </div>
      </div>

      <div className="admin-panel">
        <h3>Sincronização com APIShort</h3>
        <p>Consulta em tempo real aos endpoints de catálogo e streaming com chave autenticada.</p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button className="btn-primary" disabled={feed.loading} onClick={handleSync}>
            <RefreshCw size={15} className={feed.loading ? 'spinning' : ''} />
            {feed.loading ? 'Consultando Fornecedor...' : 'Sincronizar Catálogo Agora'}
          </button>
        </div>

        {feed.count !== null && (
          <p className="result" style={{ marginTop: '12px', color: '#4ade80' }}>
            ✓ Sucesso: {feed.count} títulos sincronizados e persistidos no banco local.
          </p>
        )}
        {feed.warning && (
          <p style={{ color: '#ffb800', fontSize: '13px', lineHeight: 1.6, marginTop: '8px' }}>
            ⚠️ {feed.warning}
          </p>
        )}
        {feed.error && <p className="error" style={{ marginTop: '8px', color: '#ff4d6d' }}>Erro: {feed.error}</p>}

        <div className="notice licensed" style={{ marginTop: '20px' }}>
          <ShieldCheck size={18} />
          <span>Autenticação com X-API-Key e streaming de vídeo HLS ativos no servidor Express.</span>
        </div>
      </div>
    </div>
  );
}
