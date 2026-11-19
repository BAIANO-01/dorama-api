import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import DramaCard from './DramaCard';

const Section = memo(function Section({
  title,
  subtitle,
  items = [],
  onViewAll,
  onCardClick,
  showRank = false,
  limit = 10,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const displayItems = items.slice(0, limit);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, displayItems]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (!displayItems.length) return null;

  return (
    <section className="stream-section fade-in">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-header-text">
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button
            className="section-view-all"
            onClick={onViewAll}
            aria-label={`Ver todos os títulos de ${title}`}
          >
            <span>Ver todos</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Row with Scroll Arrows */}
      <div className="section-row-wrapper">
        {canScrollLeft && (
          <button
            className="scroll-arrow scroll-left"
            onClick={() => scroll('left')}
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          className="section-cards-row"
          ref={scrollRef}
          onScroll={checkScroll}
        >
          {displayItems.map((d, index) => (
            <DramaCard
              key={d.id}
              drama={d}
              onClick={onCardClick}
              rank={showRank ? index + 1 : undefined}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            className="scroll-arrow scroll-right"
            onClick={() => scroll('right')}
            aria-label="Rolar para direita"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </section>
  );
});

export default Section;
