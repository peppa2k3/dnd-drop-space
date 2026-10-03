import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { setAccessToken, setSessionExpiredHandler } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSessionExpired = useCallback(() => {
    queryClient.clear();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // On first load there's no access token in memory yet, but the httpOnly
  // refresh cookie may still be valid from a previous visit - try a silent
  // refresh before deciding the person is logged out.
  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const { user: me } = await authApi.me();
        setUser(me);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser, accessToken } = await authApi.login({ email, password });
    queryClient.clear();
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, [queryClient]);

  const register = useCallback(async (name, email, password) => {
    const { user: newUser, accessToken } = await authApi.register({ name, email, password });
    queryClient.clear();
    setAccessToken(accessToken);
    setUser(newUser);
    return newUser;
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the network call fails, still clear local state below.
    }
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  const value = { user, isAuthenticated: Boolean(user), isInitializing, login, register, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
