import React from 'react';
import { useNavigate } from 'react-router-dom';
import DramaCard from '../components/DramaCard';
import { CardSkeleton } from '../components/Skeletons';

const CURATED_EXPLORE_GENRES = [
  { id: 'Todos', label: '🔥 Todos' },
  { id: 'Casa nobre', label: '👑 Casa Nobre' },
  { id: 'Lobisomem', label: '🐺 Lobisomem' },
  { id: 'Chefe', label: '💼 Chefes & Romance' },
  { id: 'Vingança', label: '⚡ Vingança & Revidar' },
  { id: 'Drama', label: '🎭 Drama' },
  { id: 'Família', label: '❤️ Família' },
  { id: 'Juventude', label: '✨ Juventude' },
];

export default function ExplorePage({
  catalog = [],
  filtered = [],
  loading,
  genre,
  setGenre,
  query,
  pageTitle,
}) {
  const navigate = useNavigate();

  const openDrama = (d) => {
    navigate(`/drama/${d.id}`);
  };

  const getGenreCount = (gId) => {
    if (gId === 'Todos') return catalog.length;
    if (gId === 'Vingança') return catalog.filter(d => d.genre === 'Vingança' || d.genre === 'revidar').length;
    if (gId === 'Lobisomem') return catalog.filter(d => d.genre === 'Lobisomem' || d.genre === 'Fantasia' || d.genre === 'Fantasia na lenda').length;
    return catalog.filter(d => d.genre === gId).length;
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="page-heading">
          <div className="eyebrow">CATÁLOGO COMPLETO</div>
          <h2>Carregando títulos...</h2>
        </div>
        <CardSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="home-container fade-in">
      <div className="page-heading">
        <div className="eyebrow">CATÁLOGO COMPLETO ({catalog.length} DORAMAS)</div>
        <h2>{pageTitle || 'Explore todas as histórias'}</h2>
        <p>Todos os títulos dublados em alta definição prontos para assistir.</p>
      </div>

      {/* Curated Category Chips */}
      <div className="categories-pill-bar" style={{ position: 'static', margin: '16px 0 20px', background: 'none' }}>
        <div className="categories-scroll-wrapper">
          {CURATED_EXPLORE_GENRES.map((g) => (
            <button
              key={g.id}
              className={`category-pill ${genre === g.id ? 'active' : ''}`}
              onClick={() => setGenre(g.id)}
            >
              <span>{g.label} ({getGenreCount(g.id)})</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px', color: '#a093ae', fontSize: '13px' }}>
        Exibindo <strong>{filtered.length}</strong> de {catalog.length} doramas
        {query && <> para &ldquo;{query}&rdquo;</>}
      </div>

      <div className="posters-grid">
        {filtered.map((d) => (
          <DramaCard key={d.id} drama={d} onClick={openDrama} />
        ))}
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <h3>Nenhum resultado encontrado</h3>
          <p>Tente outro termo de busca ou selecione outra categoria.</p>
          <button className="btn-primary" onClick={() => setGenre('Todos')}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
