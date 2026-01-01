
import React, { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { UserProfile, Message, AppMode } from '../types';
import { subscribeToProfile, auth, isFirebaseAvailable, signInAnon, addTokens, consumeToken } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AppContextType {
  userId: string | null;
  marinaProfile: UserProfile;
  setMarinaProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  handleUpgrade: () => void;
  isAnonymous: boolean;
  imageGenerationCount: number;
  tokens: number;
  isTrialActive: boolean;
  trialDaysLeft: number;
  longTermMemories: string[];
  handleAddTokens: (amount: number) => Promise<void>;
  handleConsumeToken: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  name: 'Marina',
  trait: 'kultiviert & verlockend',
  isPremium: false,
  imageGenerationCount: 0,
  tokens: 5,
  trialStartedAt: null,
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [marinaProfile, setMarinaProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [appMode, setAppMode] = useState<AppMode>('chat');
  const [longTermMemories] = useState<string[]>([
    'Der Nutzer schätzt tiefgründige, intellektuelle Gespräche.',
    'Der Nutzer liebt das Gefühl von Exklusivität und Nähe.'
  ]);

  useEffect(() => {
    if (isFirebaseAvailable() && auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAnonymous(user.isAnonymous);
          const unsubProfile = subscribeToProfile(user.uid, (data) => {
            setMarinaProfile(prev => ({ ...prev, ...data }));
          });
          return () => unsubProfile();
        } else {
          signInAnon().catch(console.error);
        }
      });
      return () => unsubscribeAuth();
    } else {
      setUserId("mock-user-123");
      setIsAnonymous(true);
    }
  }, []);

  const handleUpgrade = () => {
    setMarinaProfile(prev => ({ ...prev, isPremium: true }));
  };

  const handleAddTokens = async (amount: number) => {
    if (userId) {
      await addTokens(userId, amount);
    } else {
      setMarinaProfile(prev => ({ ...prev, tokens: prev.tokens + amount }));
    }
  };

  const handleConsumeToken = async (): Promise<boolean> => {
    if (marinaProfile.isPremium) return true;
    if (marinaProfile.tokens <= 0) return false;

    if (userId) {
      await consumeToken(userId);
    } else {
      setMarinaProfile(prev => ({ ...prev, tokens: Math.max(0, prev.tokens - 1) }));
    }
    return true;
  };

  const TRIAL_DURATION = 3 * 24 * 60 * 60 * 1000;
  const isTrialActive = marinaProfile.trialStartedAt 
    ? (Date.now() - marinaProfile.trialStartedAt) < TRIAL_DURATION 
    : true;
  
  const trialDaysLeft = marinaProfile.trialStartedAt 
    ? Math.max(0, Math.ceil((TRIAL_DURATION - (Date.now() - marinaProfile.trialStartedAt)) / (1000 * 60 * 60 * 24)))
    : 3;

  return (
    <AppContext.Provider value={{
      userId,
      marinaProfile,
      setMarinaProfile,
      appMode,
      setAppMode,
      handleUpgrade,
      isAnonymous,
      imageGenerationCount: marinaProfile.imageGenerationCount,
      tokens: marinaProfile.tokens,
      isTrialActive,
      trialDaysLeft,
      longTermMemories,
      handleAddTokens,
      handleConsumeToken
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
