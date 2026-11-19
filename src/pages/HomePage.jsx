import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, Star, Sparkles, Flame, Film, ShieldCheck, ChevronRight
} from 'lucide-react';
import Section from '../components/Section';
import { HeroSkeleton, CardSkeleton } from '../components/Skeletons';

// Curated high-impact streaming categories from DramaSDK
const STREAMING_CATEGORIES = [
  { id: 'Dublado', label: '🇧🇷 Dublados em Português', queryKey: 'Dublado' },
  { id: 'Todos', label: '🔥 Todos os Doramas', queryKey: 'Todos' },
  { id: 'Bilionários', label: '👑 Bilionários & Máfia', queryKey: 'Bilionários' },
  { id: 'Vingança', label: '⚡ Vingança & Traição', queryKey: 'Vingança' },
  { id: 'Romance', label: '❤️ Romance & Paixão', queryKey: 'Romance' },
  { id: 'FlickReels', label: '🍿 FlickReels (Dublados)', queryKey: 'flickreels' },
  { id: 'ReelShort', label: '🎬 ReelShort', queryKey: 'reelshort' },
  { id: 'AnyReel', label: '💎 AnyReel', queryKey: 'anyreel' },
];

export default function HomePage({
  catalog = [],
  loading,
  isVip,
  genre,
  setGenre,
  favs = [],
  toggleFav,
}) {
  const navigate = useNavigate();
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Top 3 featured dramas for the spotlight carousel
  const featuredDramas = useMemo(() => {
    if (!catalog.length) return [];
    // Prioritize high-rated, full-cover titles
    return catalog.slice(0, 3);
  }, [catalog]);

  const currentFeatured = featuredDramas[featuredIndex] || catalog[0] || null;

  // Auto-cycle hero spotlight every 8 seconds if not interacted
  useEffect(() => {
    if (featuredDramas.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredDramas.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredDramas.length]);

  const openDrama = (drama) => {
    if (drama?.id) navigate(`/drama/${drama.id}`);
  };

  const goCategory = (categoryKey) => {
    setGenre(categoryKey);
    navigate('/explore');
  };

  // Curated non-redundant sections
  const curatedSections = useMemo(() => {
    if (!catalog.length) return [];

    const result = [];
    const usedIds = new Set();

    // 1. TOP 10 EM ALTA
    const trendingList = catalog.slice(0, 10);
    trendingList.forEach(d => usedIds.add(d.id));
    result.push({
      key: 'trending',
      title: '🔥 Em Alta no Brasil — Top 10',
      subtitle: 'As séries mais assistidas da semana no IgaraDrama',
      items: trendingList,
      showRank: true,
      onViewAll: () => navigate('/trending'),
    });

    // 2. GÊNEROS E PROVEDORES REAIS DRAMASDK
    const genreRows = [
      {
        title: '🇧🇷 100% Dublados em Português (Brasil)',
        subtitle: 'Séries completas com dublagem profissional e áudio em português brasileiro',
        matches: d => d.isDubbedPt || d.tag === 'DUBLADO PT-BR',
        key: 'dublados-pt',
        exploreKey: 'Dublado',
      },
      {
        title: '👑 Bilionários, Máfia & Grandes Impérios',
        subtitle: 'Don poderosos, casamentos por conveniência e amores secretos',
        matches: d => (d.genre && (d.genre.includes('Bilionário') || d.genre.includes('Máfia') || d.genre.includes('CEO') || d.genre.includes('Identidade'))),
        key: 'bilionarios',
        exploreKey: 'Bilionários',
      },
      {
        title: '⚡ Vingança, Traição & Reviravoltas',
        subtitle: 'Humilhações cobradas com juros, divórcios e vinganças implacáveis',
        matches: d => (d.genre && (d.genre.includes('Vingança') || d.genre.includes('Traição') || d.genre.includes('Divórcio') || d.genre.includes('Betrayal'))),
        key: 'vinganca',
        exploreKey: 'Vingança',
      },
      {
        title: '🎬 Sucessos Globais ReelShort',
        subtitle: 'As produções de maior audiência mundial do ReelShort dubladas',
        matches: d => d.provider === 'reelshort',
        key: 'reelshort',
        exploreKey: 'reelshort',
      },
      {
        title: '💎 Originais AnyReel',
        subtitle: 'Dramas de romance arrebatador e paixão explosiva',
        matches: d => d.provider === 'anyreel',
        key: 'anyreel',
        exploreKey: 'anyreel',
      },
      {
        title: '🍿 FlickReels & GoodShort',
        subtitle: 'As histórias virais mais comentadas da internet',
        matches: d => d.provider === 'flickreels' || d.provider === 'goodshort',
        key: 'flick-good',
        exploreKey: 'flickreels',
      },
      {
        title: '❤️ Romances Proibidos & Paixão',
        subtitle: 'Olhares cruzados, reencontros inesperados e sentimentos incontroláveis',
        matches: d => (d.genre && (d.genre.includes('Romance') || d.genre.includes('Paixão') || d.genre.includes('Forbidden'))),
        key: 'romance',
        exploreKey: 'Romance',
      },
    ];

    for (const row of genreRows) {
      const matchingItems = catalog.filter(row.matches);
      if (matchingItems.length >= 2) {
        result.push({
          key: row.key,
          title: row.title,
          subtitle: row.subtitle,
          items: matchingItems,
          showRank: false,
          onViewAll: () => goCategory(row.exploreKey),
        });
      }
    }

    return result;
  }, [catalog]);

  if (loading) {
    return (
      <div className="home-container">
        <HeroSkeleton />
        <div style={{ marginTop: 40 }}>
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  const isCurrentFav = currentFeatured ? favs.includes(currentFeatured.id) : false;

  return (
    <div className="home-container">
      {/* ── CINEMATIC SPOTLIGHT HERO ── */}
      {currentFeatured && (
        <section className="hero-spotlight fade-in">
          {/* Dynamic Background Backdrop */}
          <div
            className="hero-backdrop"
            style={{ backgroundImage: `url('${currentFeatured.img}')` }}
          >
            <div className="hero-backdrop-gradient" />
          </div>

          {/* Hero Content */}
          <div className="hero-spotlight-content">
            {/* Top Badges */}
            <div className="hero-badges-row">
              <span className="hero-top-badge">
                <Flame size={13} /> #1 EM ALTA NO BRASIL
              </span>
              <span className="hero-quality-badge">4K ULTRA HD</span>
              <span className="hero-dub-badge">DUBLADO PT-BR</span>
            </div>

            {/* Title */}
            <h1 className="hero-title">{currentFeatured.title}</h1>

            {/* Metadata Line */}
            <div className="hero-meta-row">
              <span className="hero-rating">
                <Star size={14} fill="#ffb800" color="#ffb800" />
                {currentFeatured.rating || '9.8'}
              </span>
              <span className="hero-meta-dot">·</span>
              <span className="hero-meta-text">{currentFeatured.eps || 25} Episódios</span>
              <span className="hero-meta-dot">·</span>
              <span className="hero-meta-genre">{currentFeatured.genre || 'Dorama'}</span>
              <span className="hero-meta-dot">·</span>
              <span className="hero-meta-text">Completo</span>
            </div>

            {/* Hook / Synopsis */}
            <p className="hero-synopsis">
              {currentFeatured.desc ||
                'História completa em alta definição dublada em português. Episódios curtos e envolventes que prendem do início ao fim.'}
            </p>

            {/* Action Buttons */}
            <div className="hero-actions-row">
              <button
                className="hero-btn-play"
                onClick={() => openDrama(currentFeatured)}
              >
                <Play size={18} fill="currentColor" />
                <span>Assistir Episódio 1</span>
              </button>

              <button
                className={`hero-btn-list ${isCurrentFav ? 'saved' : ''}`}
                onClick={() => toggleFav && toggleFav(currentFeatured.id)}
              >
                {isCurrentFav ? <Check size={18} /> : <Plus size={18} />}
                <span>{isCurrentFav ? 'Na Minha Lista' : 'Minha Lista'}</span>
              </button>

              <button
                className="hero-btn-info"
                onClick={() => openDrama(currentFeatured)}
              >
                Detalhes
              </button>
            </div>

            {/* Carousel Dots */}
            {featuredDramas.length > 1 && (
              <div className="hero-carousel-dots">
                {featuredDramas.map((d, idx) => (
                  <button
                    key={d.id}
                    className={`carousel-dot ${idx === featuredIndex ? 'active' : ''}`}
                    onClick={() => setFeaturedIndex(idx)}
                    aria-label={`Ver destaque ${idx + 1}: ${d.title}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CURATED CATEGORY PILLS BAR ── */}
      <div className="categories-pill-bar" role="tablist" aria-label="Filtrar por categoria">
        <div className="categories-scroll-wrapper">
          {STREAMING_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${genre === cat.queryKey ? 'active' : ''}`}
              onClick={() => goCategory(cat.queryKey)}
              role="tab"
              aria-selected={genre === cat.queryKey}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── VALUE BANNER (DISCREET & STREAMING-FIRST) ── */}
      <div className="stream-trust-banner">
        <div className="trust-item">
          <Sparkles size={16} />
          <span>Episódios rápidos de 1 a 2 minutos</span>
        </div>
        <div className="trust-item">
          <Film size={16} />
          <span>100% Dublado em Português</span>
        </div>
        <div className="trust-item">
          <ShieldCheck size={16} />
          <span>Streaming HD Oficial e Licenciado</span>
        </div>
      </div>

      {/* ── CURATED STREAMING ROWS (NETFLIX STYLE) ── */}
      <div className="stream-rows-container">
        {curatedSections.map((sec) => (
          <Section
            key={sec.key}
            title={sec.title}
            subtitle={sec.subtitle}
            items={sec.items}
            showRank={sec.showRank}
            limit={12}
            onViewAll={sec.onViewAll}
            onCardClick={openDrama}
          />
        ))}
      </div>
    </div>
  );
}
