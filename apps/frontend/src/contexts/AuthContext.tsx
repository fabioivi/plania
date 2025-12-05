'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, AuthResponse } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token e usuário salvos
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    const { user, accessToken } = response;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    handleAuthResponse(response);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });
    handleAuthResponse(response);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
