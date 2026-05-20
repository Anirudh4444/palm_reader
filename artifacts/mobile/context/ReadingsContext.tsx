import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export type PalmReading = {
  id: string;
  userId: string;
  imageUri: string;
  hand: 'left' | 'right';
  dob?: string;
  language?: string;
  createdAt: string;
  analysis: {
    overview: string;
    lifeLine: string;
    heartLine: string;
    headLine: string;
    fateLine: string;
    sunLine: string;
    mountVenus: string;
    personality: string;
    career: string;
    love: string;
    health: string;
    spiritual: string;
    vedicInsight: string;
    mythologyInsight: string;
    luckyNumbers: string;
    luckyColors: string;
    favorableTime: string;
  };
};

type ReadingsContextType = {
  readings: PalmReading[];
  isLoading: boolean;
  addReading: (reading: PalmReading) => Promise<void>;
  updateReading: (id: string, updates: Partial<PalmReading>) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
  getReadingById: (id: string) => PalmReading | undefined;
  refreshReadings: () => Promise<void>;
};

const ReadingsContext = createContext<ReadingsContextType | null>(null);

async function fetchReadingsFromServer(userId: string): Promise<PalmReading[]> {
  const resp = await fetch(`${API_BASE}/api/readings?userId=${encodeURIComponent(userId)}`);
  if (!resp.ok) throw new Error('Failed to fetch readings');
  const { readings } = await resp.json();
  return readings as PalmReading[];
}

export function ReadingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [readings, setReadings] = useState<PalmReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const migrated = useRef<string>('');

  const loadReadings = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const serverReadings = await fetchReadingsFromServer(uid);

      if (migrated.current !== uid) {
        const localKey = `readings_${uid}`;
        const localData = await AsyncStorage.getItem(localKey);
        if (localData) {
          const localReadings: PalmReading[] = JSON.parse(localData);
          if (localReadings.length > 0) {
            const serverIds = new Set(serverReadings.map(r => r.id));
            const toMigrate = localReadings.filter(r => !serverIds.has(r.id));
            for (const r of toMigrate) {
              try {
                await fetch(`${API_BASE}/api/readings`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(r),
                });
              } catch { /* ignore individual failures */ }
            }
            if (toMigrate.length > 0) {
              const refreshed = await fetchReadingsFromServer(uid);
              setReadings(refreshed);
              await AsyncStorage.removeItem(localKey);
              migrated.current = uid;
              return;
            }
          }
          await AsyncStorage.removeItem(localKey);
        }
        migrated.current = uid;
      }

      setReadings(serverReadings);
    } catch (e) {
      console.error('Error loading readings:', e);
      setReadings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setReadings([]);
      setIsLoading(false);
      return;
    }
    loadReadings(userId);
  }, [userId, loadReadings]);

  const refreshReadings = useCallback(async () => {
    if (!userId) return;
    await loadReadings(userId);
  }, [userId, loadReadings]);

  const addReading = useCallback(async (reading: PalmReading) => {
    if (!userId) return;
    setReadings(prev => [reading, ...prev]);
    try {
      await fetch(`${API_BASE}/api/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading),
      });
    } catch (e) {
      console.error('Error saving reading to server:', e);
    }
  }, [userId]);

  const updateReading = useCallback(async (id: string, updates: Partial<PalmReading>) => {
    if (!userId) return;
    setReadings(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    try {
      await fetch(`${API_BASE}/api/readings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
    } catch (e) {
      console.error('Error updating reading on server:', e);
    }
  }, [userId]);

  const deleteReading = useCallback(async (id: string) => {
    if (!userId) return;
    setReadings(prev => prev.filter(r => r.id !== id));
    try {
      await fetch(`${API_BASE}/api/readings/${id}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Error deleting reading from server:', e);
    }
  }, [userId]);

  const getReadingById = useCallback((id: string) => {
    return readings.find(r => r.id === id);
  }, [readings]);

  return (
    <ReadingsContext.Provider value={{
      readings, isLoading, addReading, updateReading, deleteReading, getReadingById, refreshReadings,
    }}>
      {children}
    </ReadingsContext.Provider>
  );
}

export function useReadings() {
  const ctx = useContext(ReadingsContext);
  if (!ctx) throw new Error('useReadings must be used within ReadingsProvider');
  return ctx;
}
