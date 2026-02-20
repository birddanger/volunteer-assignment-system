import React, { useState, useCallback, useContext, createContext } from 'react';
import { User, AuthState } from '../types';
import apiClient from '../services/apiClient';

interface AuthContextType extends AuthState {
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string, swimmerTeam?: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
  });

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, phone?: string, swimmerTeam?: string) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await apiClient.register(email, password, firstName, lastName, phone, swimmerTeam);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setAuth(prev => ({ ...prev, user: data, token: data.token, isLoading: false }));
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setAuth(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await apiClient.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setAuth(prev => ({ ...prev, user: data, token: data.token, isLoading: false }));
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setAuth(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // clear local state even if backend call fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ user: null, token: null, isLoading: false, error: null });
  }, []);

  const value: AuthContextType = {
    ...auth,
    register,
    login,
    logout,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
