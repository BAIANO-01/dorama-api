import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, Play, Heart, Crown, ShieldCheck, Film, Check, Clapperboard
} from 'lucide-react';
import { EpisodeSkeleton } from '../components/Skeletons';
import { fetchEpisodes } from '../services/api';

export default function DetailPage({ catalog = [], favs = [], toggleFav, user, isVip, addToHistory }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [epsLoading, setEpsLoading] = useState(false);

  const drama = catalog.find(d => d.id === id) || null;

  // Track viewing in history
  useEffect(() => {
    if (drama && addToHistory) {
      addToHistory(drama.id);
    }
  }, [drama, addToHistory]);

  // Load real episodes from APIShort
  useEffect(() => {
    if (!drama) return;
    const rawId = drama.rawId || String(drama.id).replace(/^shortmax-/, '');
    if (!rawId) return;

    setEpsLoading(true);
    fetchEpisodes(rawId)
      .then((data) => {
        if (Array.isArray(data.episodes) && data.episodes.length) {
          setEpisodes(data.episodes);
        }
      })
      .catch((e) => console.error('Falha ao buscar episódios:', e))
      .finally(() => setEpsLoading(false));
  }, [drama]);

  const startWatching = useCallback((idx = 0) => {
    const epNum = episodes[idx]?.episode || idx + 1;
    const ep = episodes[idx];
    const isVipEp = ep ? ep.isVipOnly : epNum > 3;
    if (isVipEp && !isVip) {
      navigate('/vip');
      return;
    }
    navigate(`/watch/${drama.id}/${epNum}`);
  }, [drama?.id, episodes, isVip, navigate]);

  const formatDuration = (d) => {
    if (!d) return '1:30 min';
    return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')} min`;
  };

  if (!drama) {
    return (
      <div className="home-container">
        <div className="empty-state">
          <h3>Drama não encontrado</h3>
          <p>O título que você buscou não está disponível no catálogo.</p>
          <button className="btn-primary" onClick={() => navigate('/explore')}>
            Explorar catálogo
          </button>
        </div>
      </div>
    );
  }

  const isFav = favs.includes(drama.id);
  const totalEpCount = episodes.length || drama.eps || 25;

  return (
    <div className="home-container fade-in">
      {/* Back Button */}
      <button className="detail-back-btn" onClick={() => navigate(-1)} aria-label="Voltar à tela anterior">
        <ArrowLeft size={18} />
        <span>Voltar</span>
      </button>

      {/* Cinematic Detail Hero */}
      <div className="detail-hero-card">
        {/* Poster */}
        <div className="detail-poster-wrapper">
          <img
            src={drama.img}
            alt={drama.title}
            className="detail-poster-img"
          />
        </div>

        {/* Info */}
        <div className="detail-info-pane">
          <div className="detail-tag-badge">{drama.tag || 'DUBLADO PT-BR'}</div>
          <h1 className="detail-title">{drama.title}</h1>

          {/* Clean separated metadata */}
          <div className="detail-meta-pills">
            <span className="meta-pill-rating">
              <Star size={13} fill="#ffb800" color="#ffb800" />
              <strong>{drama.rating || '9.6'}</strong>
            </span>
            <span className="meta-pill">{drama.genre || 'Dorama'}</span>
            <span className="meta-pill">{totalEpCount} Episódios</span>
            <span className="meta-pill-licensed">
              <ShieldCheck size={13} /> Licença Oficial
            </span>
          </div>

          <p className="detail-synopsis">
            {drama.desc || 'Assista a todos os episódios completos em alta definição dublados em português.'}
          </p>

          <div className="detail-actions-row">
            <button className="detail-play-btn" onClick={() => startWatching(0)}>
              <Play size={18} fill="currentColor" />
              <span>Assistir Episódio 1</span>
            </button>
            <button className={`detail-fav-btn ${isFav ? 'active' : ''}`} onClick={() => toggleFav(drama.id)}>
              {isFav ? <Check size={18} /> : <Heart size={18} />}
              <span>{isFav ? 'Salvo na Lista' : 'Adicionar à Lista'}</span>
            </button>
            {!isVip && (
              <button className="detail-vip-btn" onClick={() => navigate('/vip')}>
                <Crown size={16} color="#ffea79" />
                <span>Assinar VIP Sem Anúncios</span>
              </button>
            )}
          </div>

          <div className="detail-license-notice">
            <ShieldCheck size={17} />
            <span>Exibição comercial em alta definição liberada via APIShort / ShortMax.</span>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="detail-episodes-section">
        <div className="detail-episodes-header">
          <div>
            <h2 className="section-title">Todos os Episódios ({totalEpCount})</h2>
            <p className="section-subtitle">Escolha qualquer episódio para assistir em alta resolução</p>
          </div>
        </div>

        {epsLoading ? (
          <EpisodeSkeleton count={8} />
        ) : (
          <div className="episodes-grid-modern">
            {episodes.length > 0 ? (
              episodes.map((ep, i) => (
                <div
                  className="episode-card-modern"
                  key={ep.id || i}
                  onClick={() => startWatching(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Assistir episódio ${ep.episode}`}
                >
                  <div
                    className="episode-thumb-box"
                    style={{ backgroundImage: `url('${ep.cover || drama.img}')` }}
                  >
                    <div className="episode-thumb-gradient" />
                    <span className="episode-badge-num">EP {ep.episode}</span>
                    {ep.isVipOnly ? (
                      <span className="episode-badge-vip">
                        <Crown size={10} color="#ffea79" /> VIP
                      </span>
                    ) : (
                      <span className="episode-badge-free">GRÁTIS</span>
                    )}
                    <div className="episode-play-center">
                      <Play size={18} fill="currentColor" />
                    </div>
                    <span className="episode-duration-pill">{formatDuration(ep.duration)}</span>
                  </div>
                  <div className="episode-card-meta">
                    <strong>Episódio {ep.episode}</strong>
                    <small>HD · Dublado PT-BR</small>
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: Math.min(totalEpCount, 25) }, (_, i) => (
                <div
                  className="episode-card-modern"
                  key={i}
                  onClick={() => startWatching(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Assistir episódio ${i + 1}`}
                >
                  <div
                    className="episode-thumb-box"
                    style={{ backgroundImage: `url('${drama.img}')` }}
                  >
                    <div className="episode-thumb-gradient" />
                    <span className="episode-badge-num">EP {i + 1}</span>
                    {i >= 3 ? (
                      <span className="episode-badge-vip">
                        <Crown size={10} color="#ffea79" /> VIP
                      </span>
                    ) : (
                      <span className="episode-badge-free">GRÁTIS</span>
                    )}
                    <div className="episode-play-center">
                      <Play size={18} fill="currentColor" />
                    </div>
                    <span className="episode-duration-pill">1:30 min</span>
                  </div>
                  <div className="episode-card-meta">
                    <strong>Episódio {i + 1}</strong>
                    <small>HD · Dublado PT-BR</small>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
