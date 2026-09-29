import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Wallet, SystemSettings } from '../types/index.ts';
import { api } from '../services/api.ts';

export type AppTab = 'home' | 'earn' | 'create' | 'wallet' | 'profile' | 'admin';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'reward';
  points?: number;
}

interface AppContextType {
  currentUser: User | null;
  wallet: Wallet | null;
  settings: SystemSettings | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  unreadCount: number;
  isLoading: boolean;
  isPhoneFrame: boolean;
  setIsPhoneFrame: (val: boolean) => void;
  isAIOpen: boolean;
  setIsAIOpen: (val: boolean) => void;
  isNotifOpen: boolean;
  setIsNotifOpen: (val: boolean) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type'], points?: number) => void;
  dismissToast: (id: string) => void;
  refreshUserData: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'info', points?: number) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, message, type, points };
    setToasts(prev => [newToast, ...prev.slice(0, 3)]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshUserData = async () => {
    try {
      const data = await api.getMe();
      setCurrentUser(data.user);
      setWallet(data.wallet);
      setSettings(data.settings);
      setUnreadCount(data.unreadNotificationsCount);
    } catch (err) {
      console.error('Failed to load user info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchUser(userId);
      setCurrentUser(res.user);
      setWallet(res.wallet);
      showToast(`Switched persona to ${res.user.displayName} (${res.user.role})`, 'info');
      // If user is admin and was on admin tab, keep or reset
      if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
        // Can open admin if desired
      } else if (activeTab === 'admin') {
        setActiveTab('home');
      }
      await refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Failed to switch user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        wallet,
        settings,
        activeTab,
        setActiveTab,
        unreadCount,
        isLoading,
        isPhoneFrame,
        setIsPhoneFrame,
        isAIOpen,
        setIsAIOpen,
        isNotifOpen,
        setIsNotifOpen,
        toasts,
        showToast,
        dismissToast,
        refreshUserData,
        switchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
