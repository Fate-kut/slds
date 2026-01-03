/**
 * Application Context Provider
 * Manages global state for the Smart Locker Desk System
 * Authentication is handled separately by AuthContext
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Locker, LogEntry, DeskMode, Notification, NotificationType } from '@/types';
import { initialLockers } from '@/data/initialData';
import { useAuth, UserProfile } from '@/contexts/AuthContext';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  
  const [lockers, setLockers] = useState<Locker[]>(initialLockers);
  const [examMode, setExamMode] = useState<boolean>(false);
  const [deskMode, setDeskMode] = useState<DeskMode>('normal');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addLog = useCallback((action: string, details: string, user: UserProfile) => {
    const newLog: LogEntry = {
      id: generateId(),
      timestamp: new Date(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      details,
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  }, []);

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
      addLog('LOGOUT', `${profile.name} logged out`, profile);
    }
    await signOut();
    setDeskMode('normal');
  }, [profile, addLog, signOut]);

  const toggleLocker = useCallback((lockerId: string) => {
    if (!profile) return;
    
    setLockers(prevLockers => 
      prevLockers.map(locker => {
        if (locker.id === lockerId) {
          const newStatus = locker.status === 'locked' ? 'unlocked' : 'locked';
          addLog(
            newStatus === 'locked' ? 'LOCKER_LOCK' : 'LOCKER_UNLOCK',
            `${locker.id} (${locker.location}) ${newStatus}`,
            profile
          );
          return { ...locker, status: newStatus };
        }
        return locker;
      })
    );
  }, [profile, addLog]);

  const lockLocker = useCallback((lockerId: string) => {
    if (!profile || profile.role !== 'teacher') return;
    
    setLockers(prevLockers =>
      prevLockers.map(locker => {
        if (locker.id === lockerId && locker.status === 'unlocked') {
          addLog('LOCKER_LOCK', `Teacher locked ${locker.id} (${locker.studentName}'s locker)`, profile);
          addNotification(
            'locker_locked',
            'Locker Locked',
            `Your locker (${locker.location}) has been locked by a teacher.`
          );
          return { ...locker, status: 'locked' };
        }
        return locker;
      })
    );
  }, [profile, addLog, addNotification]);

  const unlockLocker = useCallback((lockerId: string) => {
    if (!profile || profile.role !== 'teacher') return;
    
    setLockers(prevLockers =>
      prevLockers.map(locker => {
        if (locker.id === lockerId && locker.status === 'locked') {
          addLog('LOCKER_UNLOCK', `Teacher unlocked ${locker.id} (${locker.studentName}'s locker)`, profile);
          return { ...locker, status: 'unlocked' };
        }
        return locker;
      })
    );
  }, [profile, addLog]);

  const lockAllLockers = useCallback(() => {
    if (!profile || profile.role !== 'teacher') return;
    
    setLockers(prevLockers =>
      prevLockers.map(locker => ({ ...locker, status: 'locked' }))
    );
    addLog('LOCK_ALL', 'Teacher locked all lockers', profile);
  }, [profile, addLog]);

  const toggleExamMode = useCallback(() => {
    if (!profile || profile.role !== 'teacher') return;
    
    setExamMode(prev => {
      const newMode = !prev;
      setDeskMode(newMode ? 'exam' : 'normal');
      addLog(
        newMode ? 'EXAM_MODE_ON' : 'EXAM_MODE_OFF',
        `Teacher ${newMode ? 'enabled' : 'disabled'} exam mode`,
        profile
      );
      addNotification(
        'exam_mode',
        newMode ? 'Exam Mode Enabled' : 'Exam Mode Disabled',
        newMode 
          ? 'Research and internet access has been disabled. Only exam-related actions are permitted.'
          : 'Normal mode restored. Research and internet access is now available.'
      );
      return newMode;
    });
  }, [profile, addLog, addNotification]);

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
