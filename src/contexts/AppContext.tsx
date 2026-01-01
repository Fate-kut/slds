/**
 * Application Context Provider
 * Manages global state for the Smart Locker Desk System
 * Provides authentication, locker control, exam mode, and logging functionality
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Locker, LogEntry, DeskMode, LoginCredentials } from '@/types';
import { initialUsers, initialLockers, userCredentials } from '@/data/initialData';

/**
 * Generate simple unique IDs without external dependencies
 * Uses random string generation for unique identifiers
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

// Context interface defining all available actions and state
interface AppContextType {
  // Current authenticated user (null if not logged in)
  currentUser: User | null;
  // All lockers in the system
  lockers: Locker[];
  // Global exam mode status
  examMode: boolean;
  // Current desk mode for the active user
  deskMode: DeskMode;
  // Activity log entries
  logs: LogEntry[];
  // Authentication functions
  login: (credentials: LoginCredentials) => { success: boolean; error?: string };
  logout: () => void;
  // Locker control functions
  toggleLocker: (lockerId: string) => void;
  lockAllLockers: () => void;
  unlockLocker: (lockerId: string) => void;
  lockLocker: (lockerId: string) => void;
  // Exam mode control (teacher only)
  toggleExamMode: () => void;
  // Desk actions
  performResearch: () => { success: boolean; message: string };
  performExamAction: () => { success: boolean; message: string };
}

// Create context with undefined default
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider Component
 * Wraps the application and provides global state management
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State for current authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // State for all lockers in the system
  const [lockers, setLockers] = useState<Locker[]>(initialLockers);
  
  // Global exam mode flag - when true, restricts student actions
  const [examMode, setExamMode] = useState<boolean>(false);
  
  // Individual desk mode - derived from exam mode for students
  const [deskMode, setDeskMode] = useState<DeskMode>('normal');
  
  // Activity log - stores all system actions for auditing
  const [logs, setLogs] = useState<LogEntry[]>([]);

  /**
   * Add a new entry to the activity log
   * Records user actions with timestamp for auditing purposes
   */
  const addLog = useCallback((action: string, details: string, user: User) => {
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

  /**
   * Login function - authenticates user with username and PIN
   * Simulates RFID/biometric authentication behavior
   */
  const login = useCallback((credentials: LoginCredentials): { success: boolean; error?: string } => {
    const { username, pin } = credentials;
    
    // Find user by username
    const user = initialUsers.find(u => u.username === username);
    
    if (!user) {
      return { success: false, error: 'User not found. Please check your username.' };
    }
    
    // Verify PIN (simulating RFID/biometric verification)
    const validPin = userCredentials[username];
    if (pin !== validPin) {
      return { success: false, error: 'Invalid PIN. Please try again.' };
    }
    
    // Set current user and log the action
    setCurrentUser(user);
    addLog('LOGIN', `${user.name} logged in as ${user.role}`, user);
    
    // Reset desk mode when user logs in
    setDeskMode(examMode ? 'exam' : 'normal');
    
    return { success: true };
  }, [addLog, examMode]);

  /**
   * Logout function - clears current user session
   */
  const logout = useCallback(() => {
    if (currentUser) {
      addLog('LOGOUT', `${currentUser.name} logged out`, currentUser);
    }
    setCurrentUser(null);
    setDeskMode('normal');
  }, [currentUser, addLog]);

  /**
   * Toggle locker status between locked and unlocked
   * Students can only toggle their own locker
   */
  const toggleLocker = useCallback((lockerId: string) => {
    if (!currentUser) return;
    
    setLockers(prevLockers => 
      prevLockers.map(locker => {
        if (locker.id === lockerId) {
          const newStatus = locker.status === 'locked' ? 'unlocked' : 'locked';
          addLog(
            newStatus === 'locked' ? 'LOCKER_LOCK' : 'LOCKER_UNLOCK',
            `${locker.id} (${locker.location}) ${newStatus}`,
            currentUser
          );
          return { ...locker, status: newStatus };
        }
        return locker;
      })
    );
  }, [currentUser, addLog]);

  /**
   * Lock a specific locker (teacher function)
   */
  const lockLocker = useCallback((lockerId: string) => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    
    setLockers(prevLockers =>
      prevLockers.map(locker => {
        if (locker.id === lockerId && locker.status === 'unlocked') {
          addLog('LOCKER_LOCK', `Teacher locked ${locker.id} (${locker.studentName}'s locker)`, currentUser);
          return { ...locker, status: 'locked' };
        }
        return locker;
      })
    );
  }, [currentUser, addLog]);

  /**
   * Unlock a specific locker (teacher function)
   */
  const unlockLocker = useCallback((lockerId: string) => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    
    setLockers(prevLockers =>
      prevLockers.map(locker => {
        if (locker.id === lockerId && locker.status === 'locked') {
          addLog('LOCKER_UNLOCK', `Teacher unlocked ${locker.id} (${locker.studentName}'s locker)`, currentUser);
          return { ...locker, status: 'unlocked' };
        }
        return locker;
      })
    );
  }, [currentUser, addLog]);

  /**
   * Lock all lockers in the system (teacher emergency function)
   */
  const lockAllLockers = useCallback(() => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    
    setLockers(prevLockers =>
      prevLockers.map(locker => ({ ...locker, status: 'locked' }))
    );
    addLog('LOCK_ALL', 'Teacher locked all lockers', currentUser);
  }, [currentUser, addLog]);

  /**
   * Toggle global exam mode
   * When enabled, restricts student desk actions
   */
  const toggleExamMode = useCallback(() => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    
    setExamMode(prev => {
      const newMode = !prev;
      setDeskMode(newMode ? 'exam' : 'normal');
      addLog(
        newMode ? 'EXAM_MODE_ON' : 'EXAM_MODE_OFF',
        `Teacher ${newMode ? 'enabled' : 'disabled'} exam mode`,
        currentUser
      );
      return newMode;
    });
  }, [currentUser, addLog]);

  /**
   * Perform research action (simulated internet/research access)
   * Blocked during exam mode
   */
  const performResearch = useCallback((): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'You must be logged in.' };
    }
    
    if (examMode) {
      addLog('RESEARCH_BLOCKED', 'Attempted research during exam mode', currentUser);
      return { 
        success: false, 
        message: '⚠️ Research access is disabled during exam mode. Only exam-related actions are permitted.' 
      };
    }
    
    addLog('RESEARCH_ACCESS', 'Accessed research resources', currentUser);
    return { 
      success: true, 
      message: '✓ Research access granted. You can browse academic resources.' 
    };
  }, [currentUser, examMode, addLog]);

  /**
   * Perform exam action (always allowed)
   * Simulates exam-specific functionality
   */
  const performExamAction = useCallback((): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'You must be logged in.' };
    }
    
    addLog('EXAM_ACTION', 'Performed exam-related action', currentUser);
    return { 
      success: true, 
      message: '✓ Exam action completed successfully.' 
    };
  }, [currentUser, addLog]);

  // Context value containing all state and functions
  const value: AppContextType = {
    currentUser,
    lockers,
    examMode,
    deskMode,
    logs,
    login,
    logout,
    toggleLocker,
    lockAllLockers,
    unlockLocker,
    lockLocker,
    toggleExamMode,
    performResearch,
    performExamAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to access the app context
 * Throws error if used outside of AppProvider
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
