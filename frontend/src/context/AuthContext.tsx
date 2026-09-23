'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types/api';
import { ApiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => ApiClient.getUser());
  const [loading, setLoading] = useState<boolean>(true);

  const setUser = useCallback((newUser: User | null) => {
    ApiClient.setUser(newUser);
    setUserState(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await ApiClient.get<User>('/auth/me');
      setUser(data);
    } catch (err: any) {
      // If 401 or invalid, user is unauthenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isSuperAdmin = Boolean(
    user?.is_superadmin ||
    user?.role === 'super_admin' ||
    user?.role === 'superadmin' ||
    user?.roles?.includes('super_admin') ||
    user?.roles?.includes('superadmin')
  );

  const hasPermission = useCallback((permissionCode: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionCode);
    }
    return false;
  }, [user, isSuperAdmin]);

  const hasAnyPermission = useCallback((...codes: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return codes.some((code) => hasPermission(code));
  }, [user, isSuperAdmin, hasPermission]);

  const logout = useCallback(async () => {
    try {
      await ApiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    ApiClient.setToken(null);
    window.location.href = '/login';
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
