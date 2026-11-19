import React, { useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import DetailPage from './pages/DetailPage';
import VipPage from './pages/VipPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import DownloadPage from './pages/DownloadPage';
import WatchPage from './pages/WatchPage';
import { useCatalog } from './hooks/useCatalog';
import { useAuth } from './hooks/useAuth';
import { useLocalStorage } from './hooks/useLocalStorage';

function AppRoutes() {
  const navigate = useNavigate();
  const {
    catalog, loading, error,
    query, setQuery,
    genre, setGenre,
    genres, filtered,
    sync,
  } = useCatalog();

  const {
    user, isVip,
    handleLogin, handleRegister, handleGuestLogin, handleLogout,
    activateVip,
  } = useAuth();

  const [favs, setFavs] = useLocalStorage('igara-favs', []);
  const [history, setHistory] = useLocalStorage('igara-history', []);

  const toggleFav = useCallback((id) => {
    setFavs((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
  }, [setFavs]);

  const addToHistory = useCallback((id) => {
    setHistory((h) => [id, ...h.filter((x) => x !== id)].slice(0, 30));
  }, [setHistory]);

  // Auth handlers that navigate after success
  const onLogin = useCallback(async (email, password) => {
    const loggedUser = await handleLogin(email, password);
    if (loggedUser?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  }, [handleLogin, navigate]);

  const onRegister = useCallback(async (name, email, password, phone) => {
    await handleRegister(name, email, password, phone);
    navigate('/');
  }, [handleRegister, navigate]);

  const onGuestLogin = useCallback(() => {
    handleGuestLogin();
    navigate('/');
  }, [handleGuestLogin, navigate]);

  const onLogout = useCallback(() => {
    handleLogout();
    navigate('/auth');
  }, [handleLogout, navigate]);

  return (
    <Layout
      user={user}
      isVip={isVip}
      favsCount={favs.length}
      catalogCount={catalog.length}
      query={query}
      onQueryChange={setQuery}
    >
      <Routes>
        <Route path="/" element={
          <HomePage
            catalog={catalog}
            loading={loading}
            isVip={isVip}
            genres={genres}
            genre={genre}
            setGenre={setGenre}
            favs={favs}
            toggleFav={toggleFav}
          />
        } />
        <Route path="/explore" element={
          <ExplorePage
            catalog={catalog}
            filtered={filtered}
            loading={loading}
            genres={genres}
            genre={genre}
            setGenre={setGenre}
            query={query}
            pageTitle="Explore todas as histórias"
          />
        } />
        <Route path="/trending" element={
          <ExplorePage
            catalog={catalog}
            filtered={filtered}
            loading={loading}
            genres={genres}
            genre={genre}
            setGenre={setGenre}
            query={query}
            pageTitle="Histórias em alta"
          />
        } />
        <Route path="/drama/:id" element={
          <DetailPage
            catalog={catalog}
            favs={favs}
            toggleFav={toggleFav}
            user={user}
            isVip={isVip}
            addToHistory={addToHistory}
          />
        } />
        <Route path="/watch/:id/:ep" element={
          <WatchPage
            catalog={catalog}
            catalogLoading={loading}
            user={user}
            isVip={isVip}
            addToHistory={addToHistory}
          />
        } />
        <Route path="/watch/:id" element={
          <WatchPage
            catalog={catalog}
            catalogLoading={loading}
            user={user}
            isVip={isVip}
            addToHistory={addToHistory}
          />
        } />
        <Route path="/vip" element={
          <VipPage
            user={user}
            isVip={isVip}
            onActivateVip={activateVip}
          />
        } />
        <Route path="/favorites" element={
          <FavoritesPage catalog={catalog} favs={favs} />
        } />
        <Route path="/history" element={
          <HistoryPage catalog={catalog} history={history} />
        } />
        <Route path="/auth" element={
          <AuthScreen
            user={user}
            isVip={isVip}
            onLogin={onLogin}
            onRegister={onRegister}
            onGuestLogin={onGuestLogin}
            onLogout={onLogout}
            onGoSubscription={() => navigate('/vip')}
          />
        } />
        <Route path="/download" element={
          <DownloadPage />
        } />
        <Route path="/admin" element={
          <AdminPage catalog={catalog} user={user} sync={sync} />
        } />
        <Route path="*" element={
          <div className="empty-state">
            <h3>Página não encontrada</h3>
            <p>A página que você buscou não existe.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Voltar ao início</button>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
