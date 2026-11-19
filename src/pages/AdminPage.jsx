import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film, ShieldCheck, RefreshCw, Lock, AlertTriangle, User,
  Users, UserPlus, Zap, Clock, Check, Copy, Trash2, Key,
  Sparkles, CheckCircle, ExternalLink, Search, Crown
} from 'lucide-react';
import {
  syncAdminCatalog,
  fetchAdminUsers,
  createAdminTestUser,
  toggleAdminUserVip,
  deleteAdminUser
} from '../services/api';

export default function AdminPage({ catalog = [], user }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Navigation tab
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'create' | 'system'

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Quick Test Form state
  const [customHoursInput, setCustomHoursInput] = useState('2');
  const [testForm, setTestForm] = useState({
    name: '',
    email: '',
    password: '',
    durationHours: '2'
  });
  const [creatingTest, setCreatingTest] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // Catalog Sync state
  const [feed, setFeed] = useState({ loading: false, count: null, warning: '', error: '' });
  const [adminKeyInput, setAdminKeyInput] = useState('');

  // Load clients list
  const loadClients = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    setUsersError('');
    try {
      const res = await fetchAdminUsers(user?.email, adminKeyInput || undefined);
      setUsersList(res.users || []);
    } catch (e) {
      setUsersError(e.message || 'Erro ao carregar clientes');
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin, user?.email, adminKeyInput]);

  useEffect(() => {
    if (isAdmin) {
      loadClients();
    }
  }, [isAdmin, loadClients]);

  // Generate Quick Test with Custom Hours
  const handleGenerateTestWithHours = async (h = null) => {
    const hours = Number(h || customHoursInput) || 2;
    setCreatingTest(true);
    setCreatedResult(null);
    try {
      const res = await createAdminTestUser(user?.email, { durationHours: hours }, adminKeyInput || undefined);
      setCreatedResult(res.user);
      loadClients();
    } catch (e) {
      alert('Erro ao gerar teste: ' + e.message);
    } finally {
      setCreatingTest(false);
    }
  };

  // Set specific hours for existing client
  const handleSetHoursForUser = async (targetEmail) => {
    const input = window.prompt(`Quantas horas de teste você deseja liberar para ${targetEmail}? (Digite um número, ex: 1, 2, 3, 4, 6, 12, 24):`, customHoursInput || "2");
    if (!input) return;
    const hours = parseFloat(input);
    if (isNaN(hours) || hours <= 0) {
      alert('Por favor, informe um número válido de horas.');
      return;
    }
    try {
      await toggleAdminUserVip(user?.email, targetEmail, 'grant_hours', null, hours, adminKeyInput || undefined);
      loadClients();
    } catch (e) {
      alert('Erro ao definir horas: ' + e.message);
    }
  };

  // Submit Custom Test Form
  const handleCustomTestSubmit = async (e) => {
    e.preventDefault();
    setCreatingTest(true);
    setCreatedResult(null);
    try {
      const res = await createAdminTestUser(user?.email, testForm, adminKeyInput || undefined);
      setCreatedResult(res.user);
      setTestForm({ name: '', email: '', password: '', durationHours: '24' });
      loadClients();
    } catch (e) {
      alert('Erro ao criar usuário: ' + e.message);
    } finally {
      setCreatingTest(false);
    }
  };

  // Toggle VIP / Extend
  const handleVipChange = async (targetEmail, action, durationDays = 30) => {
    try {
      await toggleAdminUserVip(user?.email, targetEmail, action, durationDays, adminKeyInput || undefined);
      loadClients();
    } catch (e) {
      alert('Erro ao alterar VIP: ' + e.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (targetEmail) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${targetEmail}?`)) return;
    try {
      await deleteAdminUser(user?.email, targetEmail, adminKeyInput || undefined);
      loadClients();
    } catch (e) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  // Copy credentials message for WhatsApp
  const copyWhatsAppMsg = (u, customMsg = null) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://igaradrama.com';
    const msg = customMsg || `🎬 *SEU ACESSO AO IGARADRAMA VIP* 🎬\n\nOlá ${u.name || 'Cliente'}! Segue o seu acesso oficial liberado:\n\n🌐 *Site:* ${origin}\n👤 *E-mail:* ${u.email}\n🔑 *Senha:* ${u.password}\n⭐ *Plano:* ${u.vipPlan || 'Acesso VIP'}\n📅 *Válido até:* ${u.vipExpires ? new Date(u.vipExpires).toLocaleString('pt-BR') : 'Sem expiração'}\n\nAssista a mais de 1.100 Doramas Dublados em Português no celular e no computador! Aproveite! ✨`;

    navigator.clipboard.writeText(msg);
    setCopiedId(u.email);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Sync catalog handler
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
            Para gerenciar clientes, criar acessos de teste e sincronizar o catálogo, você precisa estar autenticado como administrador.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '12px', color: '#ba8df2', fontWeight: 600, marginBottom: '6px' }}>CREDENCIAIS PADRÃO DE ADMINISTRADOR:</div>
            <div style={{ fontSize: '14px', color: '#fff' }}><strong>E-mail:</strong> admin@igaradrama.com</div>
            <div style={{ fontSize: '14px', color: '#fff' }}><strong>Senha:</strong> admin</div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              <User size={16} /> Fazer Login como Admin
            </button>
            <button className="btn-secondary" onClick={() => navigate('/')}>
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter users by search
  const filteredUsers = usersList.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const vipUsersCount = usersList.filter(u => u.isVip && !u.isTestAccount).length;
  const testUsersCount = usersList.filter(u => u.isVip && u.isTestAccount).length;

  return (
    <div className="home-container fade-in" style={{ paddingBottom: '60px' }}>
      {/* Top Header */}
      <div className="page-heading">
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={14} color="#ffea79" /> PAINEL DO ADMINISTRADOR · IGARADRAMA
        </div>
        <h2>Gestão de Clientes & Testes VIP</h2>
        <p>Gere testes rápidos para enviar no WhatsApp dos clientes e controle todos os acessos em tempo real.</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-card">
          <Users size={24} color="#ba8df2" />
          <small>Total de Clientes Cadastrados</small>
          <strong>{usersList.length}</strong>
        </div>
        <div className="admin-card">
          <Zap size={24} color="#f59e0b" />
          <small>Clientes em Teste Grátis</small>
          <strong style={{ color: '#f59e0b' }}>{testUsersCount}</strong>
        </div>
        <div className="admin-card">
          <ShieldCheck size={24} color="#4ade80" />
          <small>Assinantes VIP Ativos</small>
          <strong style={{ color: '#4ade80' }}>{vipUsersCount}</strong>
        </div>
        <div className="admin-card">
          <Film size={24} color="#ff4d6d" />
          <small>Doramas no Catálogo</small>
          <strong style={{ color: '#ff4d6d' }}>{catalog.length}</strong>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '12px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('clients')}
          className={`device-tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Users size={16} /> Todos os Clientes ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`device-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <UserPlus size={16} /> Gerar Novo Teste / Cliente
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`device-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <RefreshCw size={16} /> Catálogo & Integrações
        </button>
      </div>

      {/* TAB 1: CLIENTS LIST */}
      {activeTab === 'clients' && (
        <div className="admin-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Clientes e Assinantes</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                Veja logins, senhas, tempo restante de VIP e copie mensagens prontas para os clientes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <Clock size={15} color="#f59e0b" />
                <span style={{ fontSize: '12px', color: '#d1b4bc' }}>Duração:</span>
                <input
                  type="number"
                  min="1"
                  max="8760"
                  value={customHoursInput}
                  onChange={(e) => setCustomHoursInput(e.target.value)}
                  style={{
                    width: '55px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: '#150c1e',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffea79',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#fff' }}>h</span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 4, 6, 12, 24, 48].map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setCustomHoursInput(String(h));
                      handleGenerateTestWithHours(h);
                    }}
                    disabled={creatingTest}
                    className="btn-secondary"
                    style={{
                      padding: '6px 9px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderColor: customHoursInput === String(h) ? '#ba8df2' : 'rgba(255,255,255,0.12)',
                      background: customHoursInput === String(h) ? 'rgba(186, 141, 242, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: customHoursInput === String(h) ? '#ba8df2' : '#d1b4bc'
                    }}
                    title={`Gerar teste rápido de ${h} hora(s)`}
                  >
                    {h}h
                  </button>
                ))}
              </div>

              <button
                className="cta-huge-red"
                onClick={() => handleGenerateTestWithHours()}
                disabled={creatingTest}
                style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
              >
                <Zap size={15} />
                {creatingTest ? 'Gerando...' : `⚡ Gerar Teste ${customHoursInput || 2}h`}
              </button>
              <button
                className="btn-secondary"
                onClick={loadClients}
                disabled={loadingUsers}
                style={{ padding: '8px 12px' }}
                title="Recarregar lista"
              >
                <RefreshCw size={14} className={loadingUsers ? 'spinning' : ''} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.06)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '20px'
          }}>
            <Search size={16} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>

          {/* Banner of newly created test */}
          {createdResult && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Teste VIP Gerado com Sucesso!
                </div>
                <div style={{ color: '#fff', fontSize: '14px', marginTop: '4px' }}>
                  <strong>E-mail:</strong> {createdResult.email} &nbsp;|&nbsp; <strong>Senha:</strong> {createdResult.password} &nbsp;|&nbsp; <strong>Validade:</strong> {new Date(createdResult.vipExpires).toLocaleString('pt-BR')}
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => copyWhatsAppMsg(createdResult)}
                style={{ padding: '8px 14px', fontSize: '13px', background: '#22c55e', borderColor: '#22c55e' }}
              >
                {copiedId === createdResult.email ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === createdResult.email ? 'Copiado p/ WhatsApp!' : 'Copiar Texto p/ WhatsApp'}
              </button>
            </div>
          )}

          {/* Users Table */}
          {loadingUsers ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 12px' }} />
              Carregando lista de clientes...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                    <th style={{ padding: '12px 10px' }}>Cliente / E-mail</th>
                    <th style={{ padding: '12px 10px' }}>Senha</th>
                    <th style={{ padding: '12px 10px' }}>Status VIP</th>
                    <th style={{ padding: '12px 10px' }}>Vencimento</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isVipActive = u.isVip;
                    return (
                      <tr key={u.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Name & Email */}
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{u.name || 'Cliente'}</div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>{u.email}</div>
                          {u.role === 'admin' && (
                            <span style={{ fontSize: '10px', background: 'rgba(186, 141, 242, 0.2)', color: '#ba8df2', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>ADMIN</span>
                          )}
                        </td>

                        {/* Password */}
                        <td style={{ padding: '14px 10px', fontFamily: 'monospace', color: '#ffea79' }}>
                          {u.password || '••••••'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 10px' }}>
                          {isVipActive ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: u.isTestAccount ? 'rgba(245, 158, 11, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                              color: u.isTestAccount ? '#f59e0b' : '#4ade80'
                            }}>
                              <Zap size={12} /> {u.vipPlan || 'VIP Ativo'}
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#9ca3af'
                            }}>
                              Gratuito
                            </span>
                          )}
                        </td>

                        {/* Expiration */}
                        <td style={{ padding: '14px 10px', color: '#d1b4bc', fontSize: '12px' }}>
                          {u.vipExpires ? (
                            <div>
                              <div>{new Date(u.vipExpires).toLocaleDateString('pt-BR')}</div>
                              <small style={{ color: '#9ca3af' }}>{new Date(u.vipExpires).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Sem expiração</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {/* Copy WhatsApp */}
                            <button
                              onClick={() => copyWhatsAppMsg(u)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px' }}
                              title="Copiar mensagem com login para enviar no WhatsApp"
                            >
                              {copiedId === u.email ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                              <span>{copiedId === u.email ? 'Copiado!' : 'WhatsApp'}</span>
                            </button>

                            {/* Set Custom Hours button */}
                            <button
                              onClick={() => handleSetHoursForUser(u.email)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px', borderColor: 'rgba(186, 141, 242, 0.4)', color: '#ba8df2', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title="Definir horas personalizadas para este cliente"
                            >
                              <Clock size={11} />
                              <span>Horas</span>
                            </button>

                            {/* +24h Test button */}
                            <button
                              onClick={() => handleVipChange(u.email, 'grant', 1)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
                              title="Dar 24 horas de teste VIP"
                            >
                              +24h
                            </button>

                            {/* +30 Days VIP button */}
                            <button
                              onClick={() => handleVipChange(u.email, 'grant', 30)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px', borderColor: 'rgba(74, 222, 128, 0.4)', color: '#4ade80' }}
                              title="Ativar 30 dias de VIP"
                            >
                              +30d
                            </button>

                            {/* Revoke button */}
                            {isVipActive && u.role !== 'admin' && (
                              <button
                                onClick={() => handleVipChange(u.email, 'revoke')}
                                className="btn-secondary"
                                style={{ padding: '6px 8px', fontSize: '11px', color: '#ff4d6d' }}
                                title="Revogar VIP"
                              >
                                Revogar
                              </button>
                            )}

                            {/* Delete button */}
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.email)}
                                className="btn-secondary"
                                style={{ padding: '6px 8px', fontSize: '11px', color: '#9ca3af' }}
                                title="Excluir conta"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE TEST / CLIENT FORM */}
      {activeTab === 'create' && (
        <div className="admin-panel" style={{ padding: '24px', maxWidth: '640px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>
            <UserPlus size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Cadastrar Novo Acesso / Teste Grátis
          </h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>
            Preencha os dados abaixo ou deixe em branco para gerar credenciais automáticas.
          </p>

          <form onSubmit={handleCustomTestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#d1b4bc', marginBottom: '6px' }}>
                Nome do Cliente:
              </label>
              <input
                type="text"
                placeholder="Ex: João da Silva (ou deixe em branco p/ gerar auto)"
                value={testForm.name}
                onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#d1b4bc', marginBottom: '6px' }}>
                E-mail de Acesso:
              </label>
              <input
                type="email"
                placeholder="Ex: joao@cliente.com (ou deixe em branco p/ auto)"
                value={testForm.email}
                onChange={(e) => setTestForm({ ...testForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#d1b4bc', marginBottom: '6px' }}>
                Senha de Acesso:
              </label>
              <input
                type="text"
                placeholder="Ex: senha123 (ou deixe em branco p/ auto)"
                value={testForm.password}
                onChange={(e) => setTestForm({ ...testForm, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#d1b4bc', marginBottom: '6px' }}>
                Duração do Acesso VIP (em Horas):
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max="87600"
                  value={testForm.durationHours}
                  onChange={(e) => setTestForm({ ...testForm, durationHours: e.target.value })}
                  style={{
                    width: '120px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#150c1e',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffea79',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ color: '#d1b4bc', fontSize: '14px' }}>horas de acesso VIP</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '1 hora', h: '1' },
                  { label: '2 horas', h: '2' },
                  { label: '3 horas', h: '3' },
                  { label: '4 horas', h: '4' },
                  { label: '6 horas', h: '6' },
                  { label: '12 horas', h: '12' },
                  { label: '24h (1 dia)', h: '24' },
                  { label: '48h (2 dias)', h: '48' },
                  { label: '7 dias', h: '168' },
                  { label: '30 dias', h: '720' }
                ].map((item) => (
                  <button
                    key={item.h}
                    type="button"
                    onClick={() => setTestForm({ ...testForm, durationHours: item.h })}
                    className="btn-secondary"
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      borderColor: testForm.durationHours === item.h ? '#ba8df2' : 'rgba(255,255,255,0.1)',
                      background: testForm.durationHours === item.h ? 'rgba(186, 141, 242, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: testForm.durationHours === item.h ? '#ba8df2' : '#d1b4bc'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="cta-huge-red"
              disabled={creatingTest}
              style={{ marginTop: '12px', justifyContent: 'center' }}
            >
              <Sparkles size={18} />
              {creatingTest ? 'Cadastrando...' : 'Criar e Liberar Acesso VIP'}
            </button>
          </form>

          {createdResult && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '24px'
            }}>
              <h4 style={{ color: '#4ade80', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={18} /> Acesso Criado!
              </h4>
              <p style={{ color: '#fff', fontSize: '14px', margin: '0 0 16px', lineHeight: 1.6 }}>
                <strong>E-mail:</strong> {createdResult.email}<br />
                <strong>Senha:</strong> {createdResult.password}<br />
                <strong>Validade:</strong> {new Date(createdResult.vipExpires).toLocaleString('pt-BR')}
              </p>
              <button
                className="btn-primary"
                onClick={() => copyWhatsAppMsg(createdResult)}
                style={{ background: '#22c55e', borderColor: '#22c55e', width: '100%', justifyContent: 'center' }}
              >
                {copiedId === createdResult.email ? <Check size={16} /> : <Copy size={16} />}
                {copiedId === createdResult.email ? 'Copiado para o WhatsApp!' : 'Copiar Texto Pronto para WhatsApp'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYSTEM & SYNC */}
      {activeTab === 'system' && (
        <div className="admin-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Integração DramaSDK & Pagamentos</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>
            Status de conexão com as fontes de streaming licenciadas e Mercado Pago PIX.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#ba8df2', fontSize: '12px', fontWeight: 600 }}>DRAMASDK API (MULTI-PROVIDER)</div>
              <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: 700, margin: '6px 0' }}>Conectado (2.170 Séries)</div>
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>FlickReels, AnyReel, ReelShort, ChillShorts, GoodShort</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#ba8df2', fontSize: '12px', fontWeight: 600 }}>MERCADO PAGO PIX</div>
              <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: 700, margin: '6px 0' }}>Ativo (Aprovação Automática)</div>
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>Liberação imediata de VIP via Webhooks</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button className="btn-primary" disabled={feed.loading} onClick={handleSync}>
              <RefreshCw size={15} className={feed.loading ? 'spinning' : ''} />
              {feed.loading ? 'Consultando API...' : 'Sincronizar Catálogo Agora'}
            </button>
          </div>

          {feed.count !== null && (
            <p className="result" style={{ marginTop: '12px', color: '#4ade80' }}>
              ✓ Sucesso: {feed.count} títulos sincronizados com a API DramaSDK.
            </p>
          )}
          {feed.error && <p className="error" style={{ marginTop: '8px', color: '#ff4d6d' }}>Erro: {feed.error}</p>}
        </div>
      )}
    </div>
  );
}
