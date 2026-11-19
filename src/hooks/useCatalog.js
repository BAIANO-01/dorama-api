import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchCatalog, fetchCatalogRaw } from '../services/api';

export function useCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Todos');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchCatalog()
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.items) && data.items.length) {
          setCatalog(data.items);
        }
        setError('');
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const genres = useMemo(() => {
    const set = new Set(catalog.map((d) => d.genre).filter(Boolean));
    return ['Todos', ...set];
  }, [catalog]);

  const filtered = useMemo(() => {
    return catalog.filter((d) => {
      const matchGenre = genre === 'Todos' ||
        (genre === 'Dublado' ? (d.isDubbedPt || d.tag === 'DUBLADO PT-BR') : d.genre === genre);
      const matchQuery = !query ||
        `${d.title} ${d.genre} ${d.desc || ''}`.toLowerCase().includes(query.toLowerCase());
      return matchGenre && matchQuery;
    });
  }, [catalog, genre, query]);

  /** Retorna items por gênero, limitado */
  const getByGenre = useCallback((genreName, limit = 10) => {
    return catalog
      .filter((d) => d.genre === genreName)
      .slice(0, limit);
  }, [catalog]);

  /** Busca items para IDs específicos */
  const getByIds = useCallback((ids) => {
    return catalog.filter((d) => ids.includes(d.id));
  }, [catalog]);

  /** Busca item por ID */
  const getById = useCallback((id) => {
    return catalog.find((d) => d.id === id || d.rawId === id) || null;
  }, [catalog]);

  /** Sincroniza catálogo (admin) */
  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const normalized = await fetchCatalog();
      if (Array.isArray(normalized.items) && normalized.items.length) {
        setCatalog(normalized.items);
      }
      const raw = await fetchCatalogRaw();
      const count = normalized.count ||
        (Array.isArray(raw.raw?.data) ? raw.raw.data.length : catalog.length);
      setLoading(false);
      return { count, warning: raw.warning || '' };
    } catch (e) {
      setLoading(false);
      return { count: catalog.length, warning: '' };
    }
  }, [catalog.length]);

  return {
    catalog,
    loading,
    error,
    query,
    setQuery,
    genre,
    setGenre,
    genres,
    filtered,
    getByGenre,
    getByIds,
    getById,
    sync,
  };
}
