import React, { useState } from 'react';
import {
  User, Mail, Lock, Eye, EyeOff, LogOut, Crown, Film, ShieldCheck
} from 'lucide-react';

export default function AuthScreen({ user, isVip, onLogin, onRegister, onGuestLogin, onLogout, onGoSubscription }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', isError: false });

    try {
      if (tab === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
    } catch (err) {
      setMsg({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="auth-page">
        <div className="profile-view-card fade-in">
          <div className="profile-top">
            <div className="profile-avatar-big">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <h3>{user.name || 'Usuário IgaraDrama'}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className={`profile-status-box ${isVip ? 'vip' : ''}`}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#ffb800', fontWeight: 800 }}>
                STATUS DA CONTA
              </span>
              <h4 style={{ margin: '4px 0 0', fontSize: '16px', color: '#fff' }}>
                {isVip ? '👑 Assinatura VIP Ativa' : 'Plano Gratuito'}
              </h4>
            </div>
            {!isVip ? (
              <button className="btn-vip" onClick={onGoSubscription} style={{ padding: '7px 14px', fontSize: '11px' }}>
                <Crown size={13} /> Assinar VIP
              </button>
            ) : (
              <span className="badge-vip">ILIMITADO</span>
            )}
          </div>

          <div className="profile-cards-grid">
            <div className="profile-stat-card">
              <Film size={18} color="#ba8df2" />
              <small>Streaming HD</small>
              <strong>Liberado</strong>
            </div>
            <div className="profile-stat-card">
              <ShieldCheck size={18} color="#4ade80" />
              <small>Sem Anúncios</small>
              <strong style={{ color: '#4ade80' }}>Ativo</strong>
            </div>
          </div>

          <button className="profile-logout-btn" onClick={onLogout}>
            <LogOut size={15} /> Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/IgaraDrama.png" alt="IgaraDrama" style={{ width: '34px', height: '34px', borderRadius: '8px' }} />
          </div>
          <h2>{tab === 'login' ? 'Entrar no IgaraDrama' : 'Criar Nova Conta'}</h2>
          <p>
            {tab === 'login'
              ? 'Acesse seu histórico, doramas favoritos e assinatura VIP.'
              : 'Cadastre-se para assistir aos melhores doramas curtos.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setMsg({ text: '', isError: false }); }}
          >
            Entrar
          </button>
          <button
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setMsg({ text: '', isError: false }); }}
          >
            Cadastrar
          </button>
        </div>

        {msg.text && (
          <div style={{
            padding: '9px 12px',
            borderRadius: '8px',
            background: msg.isError ? '#3d0a14' : '#0a3d1c',
            color: msg.isError ? '#ffb3be' : '#bbf7d0',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {msg.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="input-field-group">
              <label>Nome Completo</label>
              <div className="input-with-icon">
                <User size={16} />
                <input type="text" required placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
          )}

          <div className="input-field-group">
            <label>E-mail</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input type="email" required placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="input-field-group">
            <label>Senha</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input type={showPw ? 'text' : 'password'} required placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Processando...' : tab === 'login' ? 'Entrar ➔' : 'Criar Conta ➔'}
          </button>
        </form>

        <div className="auth-divider">ou</div>

        <button className="auth-guest-btn" type="button" onClick={onGuestLogin}>
          <User size={15} /> Entrar como Visitante
        </button>
      </div>
    </div>
  );
}
