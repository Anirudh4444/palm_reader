import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';

export type PalmReading = {
  id: string;
  userId: string;
  imageUri: string;
  hand: 'left' | 'right';
  dob?: string;
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
  deleteReading: (id: string) => Promise<void>;
  getReadingById: (id: string) => PalmReading | undefined;
};

const ReadingsContext = createContext<ReadingsContextType | null>(null);

export function ReadingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [readings, setReadings] = useState<PalmReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setReadings([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    AsyncStorage.getItem(`readings_${userId}`)
      .then(data => {
        if (data) setReadings(JSON.parse(data));
        else setReadings([]);
      })
      .catch(e => console.error('Error loading readings:', e))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const addReading = useCallback(async (reading: PalmReading) => {
    if (!userId) return;
    const updated = [reading, ...readings];
    setReadings(updated);
    await AsyncStorage.setItem(`readings_${userId}`, JSON.stringify(updated));
  }, [readings, userId]);

  const deleteReading = useCallback(async (id: string) => {
    if (!userId) return;
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    await AsyncStorage.setItem(`readings_${userId}`, JSON.stringify(updated));
  }, [readings, userId]);

  const getReadingById = useCallback((id: string) => {
    return readings.find(r => r.id === id);
  }, [readings]);

  return (
    <ReadingsContext.Provider value={{ readings, isLoading, addReading, deleteReading, getReadingById }}>
      {children}
    </ReadingsContext.Provider>
  );
}

export function useReadings() {
  const ctx = useContext(ReadingsContext);
  if (!ctx) throw new Error('useReadings must be used within ReadingsProvider');
  return ctx;
}
