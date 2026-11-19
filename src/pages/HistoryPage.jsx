import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import DramaCard from '../components/DramaCard';

export default function HistoryPage({ catalog, history }) {
  const navigate = useNavigate();
  const items = catalog.filter((d) => history.includes(d.id));

  return (
    <div className="home-container fade-in">
      <div className="page-heading">
        <div className="eyebrow">SUA BIBLIOTECA</div>
        <h2>Continue de onde parou</h2>
        <p>Histórico recente dos doramas que você começou a assistir.</p>
      </div>

      {items.length > 0 ? (
        <div className="posters-grid">
          {items.map((d) => (
            <DramaCard key={d.id} drama={d} onClick={(d) => navigate(`/drama/${d.id}`)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Clock size={32} />
          <h3>Seu histórico está vazio</h3>
          <p>Comece a assistir qualquer dorama e ele aparecerá automaticamente aqui.</p>
          <button className="btn-primary" onClick={() => navigate('/explore')}>
            Explorar Doramas
          </button>
        </div>
      )}
    </div>
  );
}
