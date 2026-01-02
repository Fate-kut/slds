/**
 * Type definitions for the Smart Locker Desk System
 * Defines all data structures used throughout the application
 */

// User role enum - determines access level and UI
export type UserRole = 'student' | 'teacher';

// User interface - represents authenticated users
export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  // For students, this links to their assigned locker
  lockerId?: string;
}

// Locker status - locked or unlocked
export type LockerStatus = 'locked' | 'unlocked';

// Locker interface - represents a physical locker
export interface Locker {
  id: string;
  // Which student owns this locker (null if unassigned)
  studentId: string | null;
  studentName: string | null;
  status: LockerStatus;
  // Location identifier for display
  location: string;
}

// Desk mode - normal allows all actions, exam restricts certain features
export type DeskMode = 'normal' | 'exam';

// Activity log entry - records all system actions
export interface LogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

// Authentication credentials for login
export interface LoginCredentials {
  username: string;
  pin: string;
}

// Notification types for student alerts
export type NotificationType = 'exam_mode' | 'locker_locked' | 'locker_unlocked' | 'info';

// Notification interface - represents alerts shown to students
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// System state interface - global application state
export interface SystemState {
  examMode: boolean;
  users: User[];
  lockers: Locker[];
  logs: LogEntry[];
  notifications: Notification[];
}
