import React, { memo } from 'react';
import { Play, Star } from 'lucide-react';

const DramaCard = memo(function DramaCard({ drama, onClick, rank }) {
  if (!drama) return null;

  return (
    <div
      className="stream-card"
      onClick={() => onClick(drama)}
      role="button"
      tabIndex={0}
      aria-label={`Assistir ${drama.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(drama); }}
    >
      <div className="card-poster-wrapper">
        {/* Optional rank badge (e.g. 1, 2, 3 in Em Alta) */}
        {rank !== undefined && (
          <div className="card-rank-badge">{rank}</div>
        )}

        {/* Poster Image */}
        {drama.img ? (
          <img
            src={drama.img}
            alt={drama.title}
            loading="lazy"
            decoding="async"
            className="card-poster-img"
          />
        ) : (
          <div className="card-poster-fallback" style={{ backgroundColor: drama.color || '#2b1b38' }}>
            <span>{drama.title?.charAt(0)}</span>
          </div>
        )}

        {/* Cinematic Gradient Overlays */}
        <div className="card-gradient-overlay" />

        {/* Sleek Top Badge */}
        <span className="card-tag-pill">DUBLADO</span>

        {/* Center Hover Play Button */}
        <div className="card-play-hover" aria-hidden="true">
          <Play size={22} fill="currentColor" />
        </div>

        {/* Bottom Badges on Image */}
        <div className="card-bottom-info">
          <span className="card-rating">
            <Star size={11} fill="#ffb800" color="#ffb800" />
            {drama.rating || '9.6'}
          </span>
          <span className="card-ep-count">
            {drama.eps ? `${drama.eps} eps` : 'Completo'}
          </span>
        </div>
      </div>

      {/* Info BELOW the poster - High contrast, 100% visible */}
      <div className="card-info">
        <h3 className="card-title" title={drama.title}>{drama.title}</h3>
        <div className="card-meta">
          <span className="card-genre">{drama.genre || 'Dorama'}</span>
          <span className="card-dot">·</span>
          <span className="card-audio">Áudio PT-BR</span>
        </div>
      </div>
    </div>
  );
});

export default DramaCard;
