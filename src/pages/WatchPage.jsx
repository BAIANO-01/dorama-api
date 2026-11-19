import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, List, Crown,
  Volume2, VolumeX, Maximize, X, CheckCircle, ShieldCheck
} from 'lucide-react';
import Hls from 'hls.js';
import { fetchEpisodes } from '../services/api';

export default function WatchPage({ catalog = [], user, isVip, addToHistory }) {
  const { id, ep } = useParams();
  const navigate = useNavigate();

  const drama = catalog.find(d => d.id === id) || null;
  const currentEpNum = parseInt(ep || '1', 10);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [episodes, setEpisodes] = useState([]);
  const [loadingEps, setLoadingEps] = useState(true);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const [isVipBlocked, setIsVipBlocked] = useState(false);

  // Track history
  useEffect(() => {
    if (drama && addToHistory) {
      addToHistory(drama.id);
    }
  }, [drama, addToHistory]);

  // Load episodes from APIShort
  useEffect(() => {
    if (!drama) return;
    const rawId = drama.rawId || String(drama.id).replace(/^shortmax-/, '');
    if (!rawId) return;

    setLoadingEps(true);
    fetchEpisodes(rawId)
      .then((data) => {
        if (Array.isArray(data.episodes) && data.episodes.length) {
          setEpisodes(data.episodes);
        } else {
          // Fallback
          const count = drama.eps || 25;
          setEpisodes(Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            episode: i + 1,
            duration: 90,
            streamUrl: `/api/stream/sample.m3u8?ep=${i + 1}`,
            isVipOnly: i >= 3
          })));
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar episódios:', err);
        const count = drama.eps || 25;
        setEpisodes(Array.from({ length: count }, (_, i) => ({
          id: i + 1,
          episode: i + 1,
          duration: 90,
          streamUrl: `/api/stream/sample.m3u8?ep=${i + 1}`,
          isVipOnly: i >= 3
        })));
      })
      .finally(() => setLoadingEps(false));
  }, [drama]);

  const currentEpisodeData = episodes.find(e => e.episode === currentEpNum) || episodes[currentEpNum - 1] || null;
  const isCurrentEpVip = currentEpisodeData ? currentEpisodeData.isVipOnly : currentEpNum > 3;

  // Auto-hide controls after 4 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3800);
  }, []);

  // Handle Video Loading & Hls
  useEffect(() => {
    if (isCurrentEpVip && !isVip) {
      setIsVipBlocked(true);
      setLoadingVideo(false);
      return;
    }

    setIsVipBlocked(false);
    setLoadingVideo(true);
    setError('');

    if (!currentEpisodeData && !loadingEps) {
      setError('Episódio não encontrado.');
      setLoadingVideo(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let streamUrl = currentEpisodeData?.streamUrl || `/api/stream/sample.m3u8?ep=${currentEpNum}`;
    if (user?.email && !streamUrl.includes('user=')) {
      streamUrl += `${streamUrl.includes('?') ? '&' : '?'}user=${encodeURIComponent(user.email)}`;
    }

    const isMp4 = currentEpisodeData?.videoType === 'mp4' || 
                  (currentEpisodeData?.video?.type === 'mp4') ||
                  streamUrl.includes('type=mp4') || 
                  streamUrl.endsWith('.mp4');

    if (isMp4) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = streamUrl;
      const onCanPlay = () => {
        setLoadingVideo(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      };
      const onError = () => {
        setLoadingVideo(false);
        setError('Erro ao reproduzir o vídeo. Tente novamente.');
      };
      video.addEventListener('canplay', onCanPlay, { once: true });
      video.addEventListener('error', onError, { once: true });
    } else if (Hls.isSupported()) {
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
        setLoadingVideo(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.response?.code === 403) {
          setIsVipBlocked(true);
          setError('Conteúdo exclusivo para assinantes VIP.');
          setLoadingVideo(false);
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
              setError('Erro ao carregar o fluxo de vídeo.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoadingVideo(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });
      video.addEventListener('error', () => {
        setError('Erro ao reproduzir no Safari.');
      });
    } else {
      setError('Navegador incompatível com HLS.');
      setLoadingVideo(false);
    }

    resetControlsTimer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpNum, currentEpisodeData, loadingEps, isCurrentEpVip, isVip, user?.email, resetControlsTimer]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimer();
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
    resetControlsTimer();
  };

  const goToEpisode = (epNumber) => {
    const epData = episodes.find(x => x.episode === epNumber);
    const isTargetVip = epData ? epData.isVipOnly : epNumber > 3;
    if (isTargetVip && !isVip) {
      navigate('/vip');
      return;
    }
    setDrawerOpen(false);
    navigate(`/watch/${drama.id}/${epNumber}`);
  };

  const hasPrev = currentEpNum > 1;
  const hasNext = episodes.length ? currentEpNum < episodes.length : currentEpNum < (drama?.eps || 25);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!drama) {
    return (
      <div className="watch-page-container">
        <div className="empty-state">
          <h3>Dorama não encontrado</h3>
          <button className="btn-primary" onClick={() => navigate('/explore')}>Voltar ao Catálogo</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="watch-page-container"
      ref={containerRef}
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
    >
      {/* ── VIDEO ELEMENT (FULLSCREEN) ── */}
      <video
        ref={videoRef}
        className="watch-video-player"
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { if (hasNext) goToEpisode(currentEpNum + 1); }}
        onClick={togglePlay}
      />

      {/* ── LOADING SPINNER ── */}
      {loadingVideo && (
        <div className="watch-loading-overlay">
          <div className="loading-spinner" />
          <p>Carregando Episódio {currentEpNum}...</p>
        </div>
      )}

      {/* ── ERROR OVERLAY ── */}
      {error && !isVipBlocked && (
        <div className="watch-error-overlay">
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Tentar Novamente</button>
        </div>
      )}

      {/* ── VIP BARRIER SCREEN ── */}
      {isVipBlocked && (
        <div className="watch-vip-screen">
          <Crown size={52} color="#ffea79" />
          <h2>Conteúdo Exclusivo VIP</h2>
          <p>
            Os primeiros episódios de <strong>{drama.title}</strong> são de degustação gratuita.
            Assine o <strong>IgaraDrama VIP</strong> para desbloquear todos os episódios completos em alta definição!
          </p>
          <div className="watch-vip-actions">
            <button className="cta-huge-red" onClick={() => navigate('/vip')}>
              <Crown size={20} /> Assinar VIP Ilimitado
            </button>
            <button className="btn-secondary" onClick={() => navigate(`/drama/${drama.id}`)}>
              Voltar aos Detalhes
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING OVERLAY CONTROLS ── */}
      <div className={`watch-controls-layer ${showControls ? 'visible' : 'hidden'}`}>
        {/* Top Bar: Back Button + Title + HD Tag */}
        <div className="watch-top-bar">
          <button
            className="watch-back-btn"
            onClick={(e) => { e.stopPropagation(); navigate(`/drama/${drama.id}`); }}
            aria-label="Voltar para detalhes do dorama"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="watch-title-block">
            <h3>{drama.title}</h3>
            <span>Episódio {currentEpNum} · HD Dublado PT-BR</span>
          </div>

          <div className="watch-top-actions">
            <span className="watch-hd-badge">
              <ShieldCheck size={12} /> HD
            </span>
          </div>
        </div>

        {/* Center Tap Play/Pause Feedback Icon */}
        <div className="watch-center-play-feedback" onClick={togglePlay}>
          {!isPlaying && (
            <div className="play-pause-circle">
              <Play size={36} fill="#fff" />
            </div>
          )}
        </div>

        {/* Bottom Bar: Progress, Time, Prev/Next, Episodes Drawer Toggle */}
        <div className="watch-bottom-bar" onClick={(e) => e.stopPropagation()}>
          {/* Progress Scrubber */}
          <div className="watch-progress-container">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="watch-progress-slider"
            />
            <div className="watch-time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="watch-action-buttons-row">
            <div className="watch-left-controls">
              <button
                className="watch-icon-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              </button>

              <button
                className="watch-nav-btn"
                disabled={!hasPrev}
                onClick={() => goToEpisode(currentEpNum - 1)}
                title="Episódio Anterior"
              >
                <SkipBack size={18} />
                <span className="desktop-only">Anterior</span>
              </button>

              <button
                className="watch-nav-btn"
                disabled={!hasNext}
                onClick={() => goToEpisode(currentEpNum + 1)}
                title="Próximo Episódio"
              >
                <span className="desktop-only">Próximo</span>
                <SkipForward size={18} />
              </button>
            </div>

            <div className="watch-right-controls">
              <button
                className="watch-drawer-toggle-btn"
                onClick={() => setDrawerOpen(true)}
              >
                <List size={18} />
                <span>Episódios ({currentEpNum}/{episodes.length || drama.eps || 25})</span>
              </button>

              <button className="watch-icon-btn" onClick={toggleMute} aria-label="Mudo">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button className="watch-icon-btn" onClick={toggleFullscreen} aria-label="Tela cheia">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EPISODES BOTTOM SHEET / DRAWER ── */}
      <div className={`watch-episodes-sheet-backdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`watch-episodes-sheet ${drawerOpen ? 'open' : ''}`}>
        <div className="sheet-header">
          <div>
            <h4>Todos os Episódios ({episodes.length || drama.eps || 25})</h4>
            <small>{drama.title}</small>
          </div>
          <button className="sheet-close-btn" onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sheet-episodes-grid">
          {(episodes.length ? episodes : Array.from({ length: drama.eps || 25 }, (_, i) => ({
            episode: i + 1,
            isVipOnly: i >= 3,
            duration: 90
          }))).map((epItem) => {
            const isVipEp = epItem.isVipOnly;
            const isCurrent = epItem.episode === currentEpNum;

            return (
              <button
                key={epItem.episode}
                className={`sheet-ep-btn ${isCurrent ? 'active' : ''}`}
                onClick={() => goToEpisode(epItem.episode)}
              >
                <div className="sheet-ep-num">
                  <span>EP {epItem.episode}</span>
                  {isVipEp && (
                    <span className="sheet-vip-crown" title="VIP">
                      <Crown size={12} color="#ffea79" />
                    </span>
                  )}
                </div>
                {isCurrent && <span className="sheet-playing-indicator">Assistindo</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
