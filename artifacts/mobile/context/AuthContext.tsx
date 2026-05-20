import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type User = {
  id: string;
  name: string;
  email: string;
  dob?: string;
  gender?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, dob?: string, gender?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? '';
  return domain ? `https://${domain}/api` : '/api';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Error loading user:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }

      const response = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error ?? 'Invalid email or password' };
      }

      const userData: User = data.user;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login failed. Please check your connection and try again.' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, dob?: string, gender?: string) => {
    try {
      if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }

      const response = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, dob, gender }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error ?? 'Signup failed. Please try again.' };
      }

      const userData: User = data.user;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Signup failed. Please check your connection and try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/');
    logoutTimerRef.current = setTimeout(() => {
      setUser(null);
    }, 300);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };

    try {
      await fetch(`${getApiBase()}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
    } catch (e) {
      console.error('Profile update error:', e);
    }

    await AsyncStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
