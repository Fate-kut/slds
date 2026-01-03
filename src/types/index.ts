/**
 * Type definitions for the Smart Locker Desk System
 */

// Locker status types
export type LockerStatus = 'locked' | 'unlocked';

// Desk mode types
export type DeskMode = 'normal' | 'exam';

// Notification types
export type NotificationType = 'exam_mode' | 'locker_locked' | 'locker_unlocked' | 'info' | 'system';

// Locker entity
export interface Locker {
  id: string;
  studentId: string | null;
  studentName: string;
  status: LockerStatus;
  location: string;
}

// Activity log entry
export interface LogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher';
  action: string;
  details: string;
}

// Student notification
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
