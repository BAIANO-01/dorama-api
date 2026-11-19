import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, CheckCircle, X, Play, Crown, Lock } from 'lucide-react';
import Hls from 'hls.js';

export default function VideoPlayer({ series, episodes, currentIdx, onSelectEpisode, onClose, user, isVip }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVipBlocked, setIsVipBlocked] = useState(false);
  const currentEp = episodes[currentIdx] || null;

  useEffect(() => {
    if (!currentEp || !videoRef.current) return;
    setLoading(true);
    setError('');
    setIsVipBlocked(false);

    const video = videoRef.current;
    let streamUrl = currentEp.streamUrl;

    if (!streamUrl) {
      setError('Vídeo indisponível para este episódio.');
      setLoading(false);
      return;
    }

    if (user?.email && !streamUrl.includes('user=')) {
      streamUrl += `${streamUrl.includes('?') ? '&' : '?'}user=${encodeURIComponent(user.email)}`;
    }

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          if (user?.email) {
            xhr.setRequestHeader('X-User-Email', user.email);
          }
        }
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.response?.code === 403) {
          setIsVipBlocked(true);
          setError('Este episódio é exclusivo para assinantes VIP.');
          setLoading(false);
          return;
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Erro ao carregar o vídeo via streaming.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Erro ao reproduzir no Safari.');
      });
    } else {
      setError('Seu navegador não suporta reprodução HLS.');
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentIdx, currentEp, user?.email]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < episodes.length - 1;

  const formatDuration = useCallback((d) => {
    if (!d) return 'Completo';
    return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')} min`;
  }, []);

  const handleEpisodeClick = (idx) => {
    const ep = episodes[idx];
    const isVipEp = ep?.isVipOnly || idx >= 3;
    if (isVipEp && !isVip) {
      setIsVipBlocked(true);
      return;
    }
    onSelectEpisode(idx);
  };

  return (
    <div className="player-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-label="Player de vídeo">
      <div className="player-container">
        <div className="player-header">
          <h3>
            <Clapperboard size={16} color="#ba8df2" />
            <span>{series.title} — Ep {currentEp?.episode || (currentIdx + 1)}</span>
            <span className="badge-licensed"><CheckCircle size={11} /> Licenciado</span>
          </h3>
          <button className="close-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar player">
            <X size={16} />
          </button>
        </div>
        <div className="player-body">
          <div className="video-wrapper">
            {isVipBlocked ? (
              <div className="video-vip-gate-overlay">
                <Crown size={46} color="#ffea79" />
                <h3>Conteúdo Exclusivo VIP</h3>
                <p>Os primeiros episódios são gratuitos. Assine o IgaraDrama VIP para desbloquear todos os episódios completos em alta definição!</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="cta-huge-red" onClick={() => { onClose(); navigate('/vip'); }}>
                    <Crown size={18} /> Assinar VIP Ilimitado
                  </button>
                  <button className="btn-secondary" onClick={() => setIsVipBlocked(false)}>
                    Voltar aos Grátis
                  </button>
                </div>
              </div>
            ) : (
              <>
                {loading && <div className="video-status">Carregando episódio {currentEp?.episode || (currentIdx + 1)}...</div>}
                {error && <div className="video-error">{error}</div>}
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  autoPlay
                  onEnded={() => { if (hasNext) onSelectEpisode(currentIdx + 1); }}
                />
                <div className="video-nav-buttons">
                  <button className="btn-secondary" disabled={!hasPrev} onClick={() => onSelectEpisode(currentIdx - 1)}>
                    ◀ Anterior
                  </button>
                  <button className="btn-primary" disabled={!hasNext} onClick={() => handleEpisodeClick(currentIdx + 1)}>
                    Próximo ▶
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="player-episodes-drawer">
            <div className="drawer-header">EPISÓDIOS ({episodes.length})</div>
            <div className="drawer-list">
              {episodes.map((ep, idx) => {
                const isEpVip = ep.isVipOnly || idx >= 3;
                return (
                  <button
                    key={ep.id || idx}
                    className={`drawer-ep-item ${idx === currentIdx ? 'active' : ''}`}
                    onClick={() => handleEpisodeClick(idx)}
                    aria-label={`Episódio ${ep.episode || idx + 1}`}
                    aria-current={idx === currentIdx ? 'true' : undefined}
                  >
                    <div className="ep-number-badge">{ep.episode || idx + 1}</div>
                    <div className="ep-info">
                      <strong>Episódio {ep.episode || idx + 1}</strong>
                      <small>{formatDuration(ep.duration)}</small>
                    </div>
                    {isEpVip && (
                      <span className="drawer-vip-badge" title="Exclusivo VIP">
                        <Crown size={12} color="#ffea79" />
                      </span>
                    )}
                    <Play size={12} fill={idx === currentIdx ? 'currentColor' : 'none'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
