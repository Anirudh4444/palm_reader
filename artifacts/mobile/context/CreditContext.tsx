import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CREDITS_KEY = 'hastrekha_credits';
const FREE_REPLIES_KEY = 'hastrekha_free_replies';
const COST_PER_REPLY = 2;
const FREE_REPLIES_INITIAL = 1;

type CreditContextType = {
  credits: number;
  freeRepliesLeft: number;
  canSendMessage: () => boolean;
  consumeReply: () => boolean;
  addCredits: (n: number) => Promise<void>;
  totalRepliesLeft: number;
};

const CreditContext = createContext<CreditContextType | null>(null);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(0);
  const [freeRepliesLeft, setFreeRepliesLeft] = useState(FREE_REPLIES_INITIAL);

  useEffect(() => {
    (async () => {
      const [storedCredits, storedFree] = await Promise.all([
        AsyncStorage.getItem(CREDITS_KEY),
        AsyncStorage.getItem(FREE_REPLIES_KEY),
      ]);
      if (storedCredits !== null) setCredits(parseInt(storedCredits, 10) || 0);
      if (storedFree !== null) setFreeRepliesLeft(parseInt(storedFree, 10) || 0);
    })();
  }, []);

  const canSendMessage = useCallback(() => {
    return freeRepliesLeft > 0 || credits >= COST_PER_REPLY;
  }, [freeRepliesLeft, credits]);

  const consumeReply = useCallback(() => {
    if (freeRepliesLeft > 0) {
      const newFree = freeRepliesLeft - 1;
      setFreeRepliesLeft(newFree);
      AsyncStorage.setItem(FREE_REPLIES_KEY, newFree.toString());
      return true;
    }
    if (credits >= COST_PER_REPLY) {
      const newCredits = credits - COST_PER_REPLY;
      setCredits(newCredits);
      AsyncStorage.setItem(CREDITS_KEY, newCredits.toString());
      return true;
    }
    return false;
  }, [freeRepliesLeft, credits]);

  const addCredits = useCallback(async (n: number) => {
    const newCredits = credits + n;
    setCredits(newCredits);
    await AsyncStorage.setItem(CREDITS_KEY, newCredits.toString());
  }, [credits]);

  const totalRepliesLeft = freeRepliesLeft + Math.floor(credits / COST_PER_REPLY);

  return (
    <CreditContext.Provider value={{ credits, freeRepliesLeft, canSendMessage, consumeReply, addCredits, totalRepliesLeft }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error('useCredits must be used within CreditProvider');
  return ctx;
}
