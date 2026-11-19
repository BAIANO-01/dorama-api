import React, { useState } from 'react';
import {
  Smartphone, Apple, Download, CheckCircle, Sparkles, QrCode,
  Share2, PlusSquare, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function DownloadPage() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [activeTab, setActiveTab] = useState(isIOS ? 'ios' : 'android');
  const [installedMsg, setInstalledMsg] = useState(false);

  // Determine current IP/URL for mobile scanning
  const currentOrigin = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? 'http://192.168.1.8:5173' : window.location.origin)
    : 'http://192.168.1.8:5173';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=ffffff&bgcolor=14101c&data=${encodeURIComponent(currentOrigin)}`;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await installApp();
      if (ok) setInstalledMsg(true);
    } else {
      // Fallback instructions
      alert('Para instalar no seu celular, abra esta página pelo navegador Chrome ou Safari do seu aparelho e selecione "Adicionar à tela inicial" ou "Instalar Aplicativo".');
    }
  };

  return (
    <div className="home-container fade-in">
      <div className="download-page-wrapper">
        {/* Hero Section */}
        <div className="download-hero">
          <div className="download-badge">
            <Sparkles size={14} color="#ffea79" /> APLICATIVO OFICIAL IGARADRAMA
          </div>
          <h1 className="download-title">
            Leve o <span className="red-glow">IgaraDrama</span> no seu celular
          </h1>
          <p className="download-subtitle">
            Instale o app oficial agora mesmo. Sem ocupar espaço da memória, sem anúncios irritantes e com reprodução em tela cheia na palma da sua mão.
          </p>

          <div className="download-quick-actions">
            <a
              href="https://github.com/BAIANO-01/dorama-api/releases/download/apk-latest/app-debug.apk"
              className="cta-huge-red"
              style={{ textDecoration: 'none' }}
              download
            >
              <Download size={18} />
              <span>Baixar APK Direto (.apk)</span>
            </a>
            <button className="btn-secondary" onClick={handleInstallClick}>
              <Smartphone size={18} />
              <span>{isInstalled ? 'App Instalado ✓' : 'Instalar pelo Navegador (PWA)'}</span>
            </button>
          </div>

          {installedMsg && (
            <div className="install-success-banner">
              <CheckCircle size={18} color="#4ade80" />
              <span>Parabéns! O IgaraDrama foi instalado no seu dispositivo. Abra pela tela inicial!</span>
            </div>
          )}
        </div>

        {/* Device Selection & Installation Steps */}
        <div className="download-main-grid">
          {/* Left Column: Mobile App Preview & Direct Tabs */}
          <div className="download-left-pane">
            <div className="device-tabs">
              <button
                className={`device-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
                onClick={() => setActiveTab('android')}
              >
                <Smartphone size={18} /> Android
              </button>
              <button
                className={`device-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
                onClick={() => setActiveTab('ios')}
              >
                <Apple size={18} /> iPhone & iPad (iOS)
              </button>
            </div>

            <div className="device-guide-card">
              {activeTab === 'android' ? (
                <div className="guide-content">
                  <h3>Como instalar no Android:</h3>
                  <div className="guide-steps-list">
                    <div className="guide-step-item">
                      <div className="step-num">1</div>
                      <div className="step-text">
                        <strong>Abra pelo Google Chrome</strong>
                        <p>No celular, acerte o link ou escaneie o QR Code ao lado.</p>
                      </div>
                    </div>
                    <div className="guide-step-item">
                      <div className="step-num">2</div>
                      <div className="step-text">
                        <strong>Toque em "Instalar Aplicativo"</strong>
                        <p>O banner automático de instalação aparecerá no rodapé do navegador.</p>
                      </div>
                    </div>
                    <div className="guide-step-item">
                      <div className="step-num">3</div>
                      <div className="step-text">
                        <strong>Acesso Rápido na Tela Inicial</strong>
                        <p>O ícone do IgaraDrama será adicionado como um app nativo, abrindo em tela cheia.</p>
                      </div>
                    </div>
                  </div>

                  <div className="apk-direct-box">
                    <div className="apk-info">
                      <ShieldCheck size={20} color="#4ade80" />
                      <div>
                        <strong>Versão PWA WebApp v1.0.0</strong>
                        <small>Leve (zero megabytes de armazenamento ocupado) · Atualizações automáticas</small>
                      </div>
                    </div>
                    <button className="btn-primary" onClick={handleInstallClick}>
                      <Download size={16} /> Instalar Direto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="guide-content">
                  <h3>Como instalar no iPhone (Safari):</h3>
                  <div className="guide-steps-list">
                    <div className="guide-step-item">
                      <div className="step-num">1</div>
                      <div className="step-text">
                        <strong>Abra no Safari da Apple</strong>
                        <p>Escaneie o QR code com a câmera do seu iPhone ou abra o endereço no Safari.</p>
                      </div>
                    </div>
                    <div className="guide-step-item">
                      <div className="step-num">2</div>
                      <div className="step-text">
                        <strong>Toque em Compartilhar <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong>
                        <p>Toque no ícone de compartilhamento na barra inferior do Safari.</p>
                      </div>
                    </div>
                    <div className="guide-step-item">
                      <div className="step-num">3</div>
                      <div className="step-text">
                        <strong>Selecione "Adicionar à Tela de Início" <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong>
                        <p>Role para baixo nas opções e toque em "Adicionar à Tela de Início".</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: QR Code for Immediate Mobile Testing */}
          <div className="download-right-pane" id="test-qr">
            <div className="qr-scan-card">
              <div className="qr-card-header">
                <QrCode size={22} color="#ba8df2" />
                <div>
                  <h4>Teste Imediato no Celular</h4>
                  <small>Conecte o seu smartphone na mesma rede Wi-Fi</small>
                </div>
              </div>

              <div className="qr-image-frame">
                <img
                  src={qrCodeUrl}
                  alt="QR Code para teste no celular"
                  className="qr-img"
                />
              </div>

              <div className="qr-address-badge">
                <span className="live-dot" />
                <code>{currentOrigin}</code>
              </div>

              <p className="qr-instruction">
                Aponte a câmera do seu smartphone para o QR Code acima para testar o aplicativo em tempo real no seu aparelho.
              </p>

              <div className="qr-benefits">
                <div className="qr-benefit-item">
                  <Zap size={14} color="#ffb800" /> Teste em tempo real
                </div>
                <div className="qr-benefit-item">
                  <CheckCircle size={14} color="#4ade80" /> 112 Doramas liberados
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Native Advantages Grid */}
        <div className="download-features-grid">
          <div className="feature-item-card">
            <div className="feature-icon-circle"><Zap size={22} color="#ba8df2" /></div>
            <h4>Carregamento Instantâneo</h4>
            <p>O aplicativo carrega o catálogo instantaneamente através de cache inteligente e sem travamentos.</p>
          </div>
          <div className="feature-item-card">
            <div className="feature-icon-circle"><Smartphone size={22} color="#ff4d6d" /></div>
            <h4>Experiência 100% Imersiva</h4>
            <p>Assista em tela cheia com seletor moderno de episódios, controles verticais e gestos táteis.</p>
          </div>
          <div className="feature-item-card">
            <div className="feature-icon-circle"><ShieldCheck size={22} color="#4ade80" /></div>
            <h4>Sem Ocupar Memória</h4>
            <p>Diferente de apps pesados da Play Store, o IgaraDrama roda com máxima leveza e zero desperdício de espaço.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
