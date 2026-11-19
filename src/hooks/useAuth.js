import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import * as api from '../services/api';

export function useAuth() {
  const [user, setUser, removeUser] = useLocalStorage('igara-user', null);
  const [isVip, setIsVip] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Synchronize and validate session directly with the backend server
  const refreshUser = useCallback(async (email) => {
    const targetEmail = email || user?.email;
    if (!targetEmail) {
      setIsVip(false);
      setAuthLoading(false);
      return null;
    }

    try {
      const serverUser = await api.fetchMe(targetEmail);
      if (serverUser) {
        setUser(serverUser);
        setIsVip(!!serverUser.isVip);
        setAuthLoading(false);
        return serverUser;
      }
    } catch (_) {
      // Fallback
    }

    setAuthLoading(false);
    return null;
  }, [user?.email, setUser]);

  // Check server-side VIP status on app startup
  useEffect(() => {
    if (user?.email) {
      refreshUser(user.email);
    } else {
      setIsVip(false);
      setAuthLoading(false);
    }
  }, [user?.email, refreshUser]);

  const handleLogin = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    const loggedUser = data.user;
    setUser(loggedUser);
    setIsVip(!!loggedUser.isVip);
    return loggedUser;
  }, [setUser]);

  const handleRegister = useCallback(async (name, email, password) => {
    const data = await api.register(name, email, password);
    const newUser = data.user;
    setUser(newUser);
    setIsVip(false);
    return newUser;
  }, [setUser]);

  const handleGuestLogin = useCallback(() => {
    const guest = {
      name: 'Visitante',
      email: 'visitante@igaradrama.com',
      role: 'user',
      isVip: false,
    };
    setUser(guest);
    setIsVip(false);
    return guest;
  }, [setUser]);

  const handleLogout = useCallback(() => {
    removeUser();
    setIsVip(false);
  }, [removeUser]);

  // Called after payment confirmation to sync with backend
  const syncPaymentApproval = useCallback(async () => {
    if (user?.email) {
      await refreshUser(user.email);
    }
  }, [user?.email, refreshUser]);

  const activateVip = useCallback(async (durationDays = 30) => {
    if (user?.email) {
      try {
        const res = await fetch('/api/auth/test-activate-vip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, durationDays })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setIsVip(true);
            return data.user;
          }
        }
      } catch (_) {}
      await refreshUser(user.email);
    }
  }, [user?.email, refreshUser, setUser]);

  return {
    user,
    isVip,
    authLoading,
    handleLogin,
    handleRegister,
    handleGuestLogin,
    handleLogout,
    activateVip,
    syncPaymentApproval,
    refreshUser,
  };
}
