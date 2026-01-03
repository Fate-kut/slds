/**
 * Application Context Provider
 * Manages global state for the Smart Locker Desk System
 * Authentication is handled separately by AuthContext
 * Locker system uses Supabase with real-time subscriptions
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Locker, LogEntry, DeskMode, Notification, NotificationType } from '@/types';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { useLockerSystem } from '@/hooks/useLockerSystem';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

interface AppContextType {
  currentUser: UserProfile | null;
  lockers: Locker[];
  examMode: boolean;
  deskMode: DeskMode;
  logs: LogEntry[];
  notifications: Notification[];
  isLoading: boolean;
  logout: () => void;
  toggleLocker: (lockerId: string) => void;
  lockAllLockers: () => void;
  unlockLocker: (lockerId: string) => void;
  lockLocker: (lockerId: string) => void;
  toggleExamMode: () => void;
  performResearch: () => { success: boolean; message: string };
  performExamAction: () => { success: boolean; message: string };
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  addLocker: (locker: Omit<Locker, 'status'> & { location: string }) => Promise<boolean>;
  updateLocker: (lockerId: string, updates: Partial<Locker>) => Promise<boolean>;
  deleteLocker: (lockerId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const {
    lockers,
    logs,
    examMode,
    isLoading,
    lockLocker: dbLockLocker,
    unlockLocker: dbUnlockLocker,
    toggleLocker: dbToggleLocker,
    lockAllLockers: dbLockAllLockers,
    toggleExamMode: dbToggleExamMode,
    addLocker,
    updateLocker,
    deleteLocker,
    addLog,
  } = useLockerSystem();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Derive desk mode from exam mode
  const deskMode: DeskMode = examMode ? 'exam' : 'normal';

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
  ) => {
    const newNotification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const logout = useCallback(async () => {
    if (profile) {
      await addLog('LOGOUT', `${profile.name} logged out`, profile);
    }
    await signOut();
  }, [profile, addLog, signOut]);

  const toggleLocker = useCallback((lockerId: string) => {
    dbToggleLocker(lockerId);
  }, [dbToggleLocker]);

  const lockLocker = useCallback((lockerId: string) => {
    dbLockLocker(lockerId);
  }, [dbLockLocker]);

  const unlockLocker = useCallback((lockerId: string) => {
    dbUnlockLocker(lockerId);
  }, [dbUnlockLocker]);

  const lockAllLockers = useCallback(() => {
    dbLockAllLockers();
  }, [dbLockAllLockers]);

  const toggleExamMode = useCallback(() => {
    dbToggleExamMode();
  }, [dbToggleExamMode]);

  const performResearch = useCallback((): { success: boolean; message: string } => {
    if (!profile) {
      return { success: false, message: 'You must be logged in.' };
    }
    
    if (examMode) {
      addLog('RESEARCH_BLOCKED', 'Attempted research during exam mode', profile);
      return { 
        success: false, 
        message: '⚠️ Research access is disabled during exam mode. Only exam-related actions are permitted.' 
      };
    }
    
    addLog('RESEARCH_ACCESS', 'Accessed research resources', profile);
    return { 
      success: true, 
      message: '✓ Research access granted. You can browse academic resources.' 
    };
  }, [profile, examMode, addLog]);

  const performExamAction = useCallback((): { success: boolean; message: string } => {
    if (!profile) {
      return { success: false, message: 'You must be logged in.' };
    }
    
    addLog('EXAM_ACTION', 'Performed exam-related action', profile);
    return { 
      success: true, 
      message: '✓ Exam action completed successfully.' 
    };
  }, [profile, addLog]);

  const value: AppContextType = {
    currentUser: profile,
    lockers,
    examMode,
    deskMode,
    logs,
    notifications,
    isLoading,
    logout,
    toggleLocker,
    lockAllLockers,
    unlockLocker,
    lockLocker,
    toggleExamMode,
    performResearch,
    performExamAction,
    markNotificationRead,
    clearNotifications,
    addLocker,
    updateLocker,
    deleteLocker,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
