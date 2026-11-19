import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import DramaCard from '../components/DramaCard';

export default function FavoritesPage({ catalog, favs }) {
  const navigate = useNavigate();
  const items = catalog.filter((d) => favs.includes(d.id));

  return (
    <div className="home-container fade-in">
      <div className="page-heading">
        <div className="eyebrow">SUA BIBLIOTECA</div>
        <h2>Histórias favoritas</h2>
        <p>Suas escolhas salvas para assistir quando quiser.</p>
      </div>

      {items.length > 0 ? (
        <div className="posters-grid">
          {items.map((d) => (
            <DramaCard key={d.id} drama={d} onClick={(d) => navigate(`/drama/${d.id}`)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={32} />
          <h3>Sua lista está vazia</h3>
          <p>Explore o catálogo e adicione histórias aos seus favoritos.</p>
          <button className="btn-primary" onClick={() => navigate('/explore')}>
            Explorar Doramas
          </button>
        </div>
      )}
    </div>
  );
}
