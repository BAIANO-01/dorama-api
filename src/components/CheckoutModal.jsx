import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown, X, QrCode, CreditCard, Copy, Check, Shield, RefreshCw,
  CheckCircle, Play
} from 'lucide-react';
import { createPixPayment, checkPaymentStatus } from '../services/api';

export default function CheckoutModal({ plan, user, onClose, onSuccess }) {
  const [method, setMethod] = useState('pix');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const isMonthly = plan === 'monthly';
  const price = isMonthly ? '20,00' : '10,00';
  const title = isMonthly ? 'Plano Mensal (30 Dias)' : 'Plano Semanal (7 Dias)';

  useEffect(() => {
    let pollInterval = null;
    setLoading(true);
    setError('');

    createPixPayment(plan, user?.email || 'cliente@igaradrama.com', user?.name || 'Cliente IgaraDrama')
      .then((d) => {
        setPaymentData(d);
        setLoading(false);

        if (d.id) {
          pollInterval = setInterval(async () => {
            try {
              const statusData = await checkPaymentStatus(d.id);
              if (statusData.isApproved) {
                clearInterval(pollInterval);
                setCompleted(true);
                onSuccess();
              }
            } catch (_) {}
          }, 4000);
        }
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [plan, user, onSuccess]);

  const copyPix = useCallback(() => {
    const code = paymentData?.qr_code || '';
    if (code) {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [paymentData]);

  const simulateApproval = useCallback(() => {
    setCompleted(true);
    onSuccess();
  }, [onSuccess]);

  return (
    <div className="checkout-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-label="Checkout">
      <div className="checkout-card">
        <div className="checkout-header">
          <h3>
            <Crown size={18} color="#ffb800" />
            <span>Finalizar Assinatura VIP</span>
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Fechar checkout">
            <X size={16} />
          </button>
        </div>

        {completed ? (
          <div className="checkout-success-view">
            <div className="success-icon-badge">
              <CheckCircle size={40} />
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Pagamento Aprovado!</h3>
            <p style={{ color: '#d1b4bc', fontSize: '13px', maxWidth: '340px', margin: 0, lineHeight: 1.6 }}>
              Parabéns! Seu <strong>{title}</strong> foi confirmado com sucesso via Mercado Pago. Acesso ilimitado liberado!
            </p>
            <button className="cta-huge-red" style={{ fontSize: '14px', padding: '12px 24px' }} onClick={onClose}>
              <Play size={16} fill="currentColor" /> Começar a Assistir
            </button>
          </div>
        ) : (
          <div className="checkout-body">
            <div className="checkout-plan-summary">
              <div>
                <strong>{title}</strong>
                <small>Liberação automática e instantânea</small>
              </div>
              <div className="price-tag">
                <small style={{ fontSize: '14px', color: '#ff4d6d' }}>R$ </small>{price}
              </div>
            </div>

            <div className="checkout-methods">
              <button className={`checkout-tab ${method === 'pix' ? 'active' : ''}`} onClick={() => setMethod('pix')}>
                <QrCode size={15} /> PIX
              </button>
              <button className={`checkout-tab ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}>
                <CreditCard size={15} /> Cartão
              </button>
            </div>

            {loading ? (
              <div className="pix-box" style={{ padding: '36px 18px' }}>
                <RefreshCw size={28} className="spinning" color="#ff4d6d" />
                <p style={{ margin: 0, fontSize: '12px', color: '#e2cad0' }}>Gerando QR Code Pix via Mercado Pago...</p>
              </div>
            ) : error ? (
              <div className="pix-box" style={{ borderColor: '#ef233c' }}>
                <p style={{ color: '#ffb3be', margin: 0 }}>{error}</p>
                <button className="btn-primary" onClick={simulateApproval} style={{ marginTop: '8px' }}>
                  Ativar VIP em Modo Demonstração
                </button>
              </div>
            ) : method === 'pix' ? (
              <div className="pix-box">
                <div className="pix-qr-frame">
                  {paymentData?.qr_code_base64 ? (
                    <img
                      src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                      alt="QR Code PIX Mercado Pago"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <QrCode size={90} color="#000" />
                  )}
                </div>
                <div className="pix-code-field">
                  {paymentData?.qr_code || 'Chave PIX sendo processada...'}
                </div>
                <button className="copy-pix-btn" onClick={copyPix}>
                  {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  {copied ? 'Código Copiado!' : 'Copiar Código Pix'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                  <span className="mp-badge-secure">
                    <Shield size={12} /> Mercado Pago
                  </span>
                  <button onClick={simulateApproval} style={{ background: 'none', border: 0, color: '#ff8800', fontSize: '10px', textDecoration: 'underline', cursor: 'pointer' }}>
                    Simular Aprovação (Teste)
                  </button>
                </div>
              </div>
            ) : (
              <div className="pix-box" style={{ textAlign: 'left', padding: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <input className="pix-code-field" placeholder="Número do Cartão" style={{ color: '#fff' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="pix-code-field" placeholder="Validade: MM/AA" style={{ color: '#fff' }} />
                    <input className="pix-code-field" placeholder="CVV" style={{ color: '#fff' }} />
                  </div>
                  <input className="pix-code-field" placeholder="Nome no cartão" style={{ color: '#fff' }} />
                </div>
                <button className="checkout-confirm-btn" style={{ marginTop: '12px' }} onClick={simulateApproval}>
                  Pagar R$ {price} com Cartão
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
