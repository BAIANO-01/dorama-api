import React from 'react';

export function CardSkeleton({ count = 10 }) {
  return (
    <div className="posters-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-poster" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return <div className="skeleton skeleton-hero" />;
}

export function EpisodeSkeleton({ count = 6 }) {
  return (
    <div className="episodes-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton skeleton-episode" key={i} />
      ))}
    </div>
  );
}
