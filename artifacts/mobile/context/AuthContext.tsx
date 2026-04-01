import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type User = {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const usersData = await AsyncStorage.getItem('users');
      const users: (User & { password: string })[] = usersData ? JSON.parse(usersData) : [];
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) {
        return { success: false, error: 'Invalid email or password' };
      }
      const { password: _, ...userData } = found;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, dob?: string, gender?: string) => {
    try {
      const usersData = await AsyncStorage.getItem('users');
      const users: (User & { password: string })[] = usersData ? JSON.parse(usersData) : [];
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: false, error: 'An account with this email already exists' };
      }
      const newUser: User & { password: string } = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password,
        dob,
        gender,
      };
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      const { password: _, ...userData } = newUser;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
    setTimeout(() => router.replace('/'), 50);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    await AsyncStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    const usersData = await AsyncStorage.getItem('users');
    if (usersData) {
      const users: (User & { password: string })[] = JSON.parse(usersData);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...data };
        await AsyncStorage.setItem('users', JSON.stringify(users));
      }
    }
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
