import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Calendar, Clapperboard, Sparkles, Download, Ban, Laptop,
  Smartphone, Apple, Play
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

export default function VipPage({ user, isVip, onActivateVip }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="home-container">
      <div className="vip-page fade-in">
      {checkoutOpen && (
        <CheckoutModal
          plan={selectedPlan}
          user={user}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={onActivateVip}
        />
      )}

      <div className="vip-header">
        <div className="vip-ribbon">
          <Crown size={13} color="#ffea79" /> ASSINE AGORA E ASSISTA SEM LIMITES!
        </div>
        <h1 className="vip-title-main">
          SEU APP DE <span className="red-glow">DORAMAS CURTOS</span>
        </h1>
        <p className="vip-subtitle">
          Histórias envolventes, romances, ação, vingança e muito mais, na palma da sua mão!
        </p>
      </div>

      <div className="vip-grid">
        <div className="vip-mockup-wrapper">
          <div className="vip-mockup-glow" />
          <img src="/landing-promo.jpg" alt="IgaraDrama App" className="vip-mockup-img" />
          <div className="vip-platforms">
            <span>Disponível para:</span>
            <div className="platform-pill"><Smartphone size={13} /> Android</div>
            <div className="platform-pill"><Apple size={13} /> iOS</div>
          </div>
        </div>

        <div className="vip-content-wrapper">
          <div className="vip-plans-row">
            <div
              className={`plan-card ${selectedPlan === 'weekly' ? 'active' : ''}`}
              onClick={() => setSelectedPlan('weekly')}
              role="button"
              tabIndex={0}
              aria-label="Plano Semanal R$10"
            >
              <div className="plan-icon-wrapper"><Calendar size={20} /></div>
              <div className="plan-name">PLANO SEMANAL</div>
              <div className="plan-price"><small>R$</small>10<small>,00</small></div>
              <div className="plan-period-badge">Acesso por 7 dias</div>
            </div>

            <div
              className={`plan-card featured ${selectedPlan === 'monthly' ? 'active' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
              role="button"
              tabIndex={0}
              aria-label="Plano Mensal R$20"
            >
              <span className="badge-vantajoso">MAIS VANTAJOSO</span>
              <div className="plan-icon-wrapper"><Crown size={20} /></div>
              <div className="plan-name">PLANO MENSAL</div>
              <div className="plan-price"><small>R$</small>20<small>,00</small></div>
              <div className="plan-period-badge">Acesso por 30 dias</div>
            </div>
          </div>

          <div className="vantagens-divider">VANTAGENS DO IGARADRAMA</div>

          <div className="vantagens-grid">
            <div className="vantagem-card">
              <div className="vantagem-icon"><Clapperboard size={16} /></div>
              <div className="vantagem-label">Catálogo<small>atualizado</small></div>
            </div>
            <div className="vantagem-card">
              <div className="vantagem-icon"><Sparkles size={16} /></div>
              <div className="vantagem-label">Qualidade<small>em HD</small></div>
            </div>
            <div className="vantagem-card">
              <div className="vantagem-icon"><Download size={16} /></div>
              <div className="vantagem-label">Offline<small>(baixe e veja)</small></div>
            </div>
            <div className="vantagem-card">
              <div className="vantagem-icon"><Ban size={16} /></div>
              <div className="vantagem-label">Sem<small>anúncios</small></div>
            </div>
            <div className="vantagem-card">
              <div className="vantagem-icon"><Laptop size={16} /></div>
              <div className="vantagem-label">Multi<small>plataforma</small></div>
            </div>
          </div>

          <button className="cta-huge-red" onClick={() => setCheckoutOpen(true)}>
            <Crown size={22} /> GARANTA JÁ SEU ACESSO! ➔
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
