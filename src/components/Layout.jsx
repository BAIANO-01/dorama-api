import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Compass, Flame, Heart, Clock, User, Crown, Settings, Menu, Search, X, LogOut, ChevronDown, Smartphone, Download, Phone, Bell, Sparkles
} from 'lucide-react';
import { fetchNotifications } from '../services/api';

const NAV_LINKS = [
  { label: 'Início', path: '/' },
  { label: 'Explorar', path: '/explore' },
  { label: 'Em Alta', path: '/trending' },
  { label: 'Baixar App', path: '/download' },
  { label: 'Minha Lista', path: '/favorites' },
  { label: 'Histórico', path: '/history' },
];

const BOTTOM_NAV_ITEMS = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Compass, label: 'Explorar', path: '/explore' },
  { icon: Crown, label: 'VIP', path: '/vip' },
  { icon: Heart, label: 'Minha Lista', path: '/favorites' },
  { icon: User, label: 'Perfil', path: '/auth' },
];

export default function Layout({
  children,
  user,
  isVip,
  favsCount,
  catalogCount,
  query,
  onQueryChange,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);

  // Notification Bell State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const userMenuRef = useRef(null);

  // Load and poll notifications
  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const res = await fetchNotifications();
        if (Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
          const readIds = JSON.parse(localStorage.getItem('igara_read_notifs') || '[]');
          const unread = res.notifications.filter(n => !readIds.includes(n.id)).length;
          setUnreadCount(unread);
        }
      } catch (_) {}
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 45000);
    return () => clearInterval(interval);
  }, []);

  const openNotifications = () => {
    setNotifModalOpen(true);
    if (notifications.length > 0) {
      const allIds = notifications.map(n => n.id);
      localStorage.setItem('igara_read_notifs', JSON.stringify(allIds));
      setUnreadCount(0);
    }
  };

  // Detect scroll to add blur/background to navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const go = useCallback((path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchOpenMobile(false);
    window.scrollTo(0, 0);
  }, [navigate]);

  const isActive = useCallback((path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  }, [currentPath]);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    onQueryChange(val);
    if (val && currentPath !== '/explore') {
      navigate('/explore');
    }
  }, [currentPath, navigate, onQueryChange]);

  // If on dedicated watch route, render pure fullscreen window (no navbar/footer/bottom nav)
  if (currentPath.startsWith('/watch')) {
    return <main className="stream-main-fullscreen">{children}</main>;
  }

  return (
    <div className="stream-app">
      {/* ── TOP STREAMING NAVBAR ── */}
      <header className={`stream-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Left: Mobile hamburger + Logo + Desktop Nav Links */}
          <div className="navbar-left">
            <button
              className="navbar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <button className="navbar-brand" onClick={() => go('/')}>
              <img src="/IgaraDrama.png" alt="IgaraDrama" className="navbar-logo-img" />
              <span className="navbar-logo-text">igara<span>drama</span></span>
            </button>

            <nav className="navbar-links" aria-label="Navegação principal">
              {NAV_LINKS.map(({ label, path }) => (
                <button
                  key={path}
                  className={`navbar-link ${isActive(path) ? 'active' : ''}`}
                  onClick={() => go(path)}
                >
                  {label}
                  {path === '/favorites' && favsCount > 0 && (
                    <span className="navbar-badge">{favsCount}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Search + VIP CTA + User Profile */}
          <div className="navbar-right">
            {/* Search Input */}
            <div className={`navbar-search ${searchOpenMobile ? 'mobile-expanded' : ''}`}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Buscar doramas, gêneros..."
                aria-label="Buscar doramas"
              />
              {query && (
                <button className="search-clear" onClick={() => onQueryChange('')} aria-label="Limpar busca">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="navbar-icon-btn mobile-only"
              onClick={() => setSearchOpenMobile(!searchOpenMobile)}
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Notification Bell (Sino de Avisos) */}
            <button
              className="navbar-bell-btn"
              onClick={openNotifications}
              aria-label="Avisos e Notificações"
              title="Notificações"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="navbar-bell-badge">{unreadCount}</span>
              )}
            </button>

            {/* VIP CTA Button */}
            {!isVip ? (
              <button className="navbar-vip-btn" onClick={() => go('/vip')}>
                <Crown size={15} color="#ffea79" />
                <span>ASSINAR VIP</span>
              </button>
            ) : (
              <span className="navbar-vip-active">
                <Crown size={13} /> VIP
              </span>
            )}

            {/* User Profile Menu */}
            <div className="navbar-user-dropdown" ref={userMenuRef}>
              <button
                className="navbar-avatar-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="Menu do usuário"
                aria-expanded={userDropdownOpen}
              >
                <div className="avatar-circle">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu fade-in">
                  <div className="dropdown-user-header">
                    <strong>{user ? user.name : 'Visitante'}</strong>
                    <small>{user ? user.email : 'Faça login para salvar seus doramas'}</small>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => go('/auth')}>
                    <User size={16} />
                    {user ? 'Minha Conta' : 'Entrar / Criar Conta'}
                  </button>
                  <button className="dropdown-item" onClick={() => go('/vip')}>
                    <Crown size={16} color="#ffb800" />
                    {isVip ? 'Gerenciar Assinatura VIP' : 'Assinar VIP Sem Anúncios'}
                  </button>
                  <button className="dropdown-item" onClick={() => go('/favorites')}>
                    <Heart size={16} /> Minha Lista ({favsCount})
                  </button>
                  <button className="dropdown-item" onClick={() => go('/history')}>
                    <Clock size={16} /> Histórico
                  </button>
                  <button className="dropdown-item" onClick={() => go('/download')}>
                    <Smartphone size={16} color="#ba8df2" /> Baixar App no Celular
                  </button>
                  {(user?.role === 'admin' || user?.email === 'joaquim@igaradrama.com') && (
                    <>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item text-muted" onClick={() => go('/admin')}>
                        <Settings size={15} /> Painel de Administração
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OUT DRAWER ── */}
      <div
        className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} aria-label="Menu mobile">
        <div className="drawer-header">
          <button className="navbar-brand" onClick={() => go('/')}>
            <img src="/IgaraDrama.png" alt="IgaraDrama" className="navbar-logo-img" />
            <span className="navbar-logo-text">igara<span>drama</span></span>
          </button>
          <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section-label">NAVEGAÇÃO</div>
          {NAV_LINKS.map(({ label, path }) => (
            <button
              key={path}
              className={`drawer-link ${isActive(path) ? 'active' : ''}`}
              onClick={() => go(path)}
            >
              {label}
              {path === '/favorites' && favsCount > 0 && (
                <span className="drawer-badge">{favsCount}</span>
              )}
            </button>
          ))}

          <div className="drawer-section-label">ASSINATURA</div>
          <button className="drawer-vip-card" onClick={() => go('/vip')}>
            <div className="drawer-vip-card-icon">
              <Crown size={24} color="#ffea79" />
            </div>
            <div>
              <strong>{isVip ? '👑 VIP Ativo' : 'Seja Membro VIP'}</strong>
              <small>{isVip ? 'Acesso ilimitado e em HD' : 'A partir de R$ 10,00 sem anúncios'}</small>
            </div>
          </button>

          <div className="drawer-section-label">APLICATIVO</div>
          <button className="drawer-link" onClick={() => go('/download')}>
            <Smartphone size={18} color="#ba8df2" /> Instalar App no Celular
          </button>

          <div className="drawer-section-label">CONTA</div>
          <button className="drawer-link" onClick={() => go('/auth')}>
            <User size={18} /> {user ? 'Minha Conta' : 'Entrar / Cadastro'}
          </button>
          {(user?.role === 'admin' || user?.email === 'joaquim@igaradrama.com') && (
            <button className="drawer-link text-dim" onClick={() => go('/admin')}>
              <Settings size={18} /> Painel de Administração
            </button>
          )}

          <div className="drawer-section-label">SUPORTE</div>
          <a
            href="https://wa.me/557491209137?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20IgaraDrama"
            target="_blank"
            rel="noreferrer"
            className="drawer-link"
            style={{ color: '#4ade80', textDecoration: 'none' }}
          >
            <Phone size={18} /> WhatsApp: (74) 9120-9137
          </a>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="stream-main">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="stream-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/IgaraDrama.png" alt="IgaraDrama" className="footer-logo-img" />
            <div>
              <h4>igara<span>drama</span></h4>
              <p>O melhor catálogo de doramas curtos e minisséries dubladas em português.</p>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <strong>Catálogo</strong>
              <button onClick={() => go('/explore')}>Todos os Doramas</button>
              <button onClick={() => go('/trending')}>Mais Assistidos</button>
              <button onClick={() => go('/vip')}>Planos VIP</button>
            </div>
            <div>
              <strong>Minha Conta</strong>
              <button onClick={() => go('/auth')}>Meu Perfil</button>
              <button onClick={() => go('/favorites')}>Minha Lista</button>
              <button onClick={() => go('/history')}>Histórico</button>
            </div>
            <div>
              <strong>Suporte Oficial</strong>
              <a
                href="https://wa.me/557491209137?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20IgaraDrama"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textDecoration: 'none', margin: '4px 0' }}
              >
                <Phone size={14} /> +55 74 9120-9137
              </a>
              <small style={{ color: '#9ca3af', fontSize: '11px' }}>Atendimento e Dúvidas VIP</small>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 IgaraDrama · Streaming Licenciado em Alta Definição · {catalogCount} Doramas</span>
          {user?.role === 'admin' && (
            <button className="footer-admin-link" onClick={() => go('/admin')}>Área Administrativa</button>
          )}
        </div>
      </footer>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className="stream-bottom-nav" aria-label="Navegação móvel">
        {BOTTOM_NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            className={`bottom-nav-item ${isActive(path) ? 'active' : ''}`}
            onClick={() => go(path)}
            aria-label={label}
            aria-current={isActive(path) ? 'page' : undefined}
          >
            <div className="bottom-nav-icon">
              <Icon size={20} />
              {path === '/vip' && !isVip && <span className="bottom-vip-dot" />}
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── NOTIFICATION MODAL ── */}
      {notifModalOpen && (
        <div className="notif-modal-backdrop fade-in" onClick={() => setNotifModalOpen(false)}>
          <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <h3>
                <Bell size={20} color="#ba8df2" />
                <span>Notificações & Avisos</span>
              </h3>
              <button className="notif-close-btn" onClick={() => setNotifModalOpen(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <div className="notif-modal-body">
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9ca3af' }}>
                  <Bell size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>Nenhuma notificação no momento.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="notif-card">
                    <div className="notif-card-top">
                      <span className={`notif-badge ${n.type || 'update'}`}>
                        {n.type === 'drama' ? '🎬 Dorama' : (n.type === 'promo' ? '⭐ VIP' : '🚀 Atualização')}
                      </span>
                      <span className="notif-date">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                      </span>
                    </div>
                    <h4 className="notif-title">{n.title}</h4>
                    <p className="notif-message">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
