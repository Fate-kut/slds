/**
 * Type definitions for the Smart Locker Desk System
 */

// Locker status types
export type LockerStatus = 'locked' | 'unlocked';

// Desk mode types
export type DeskMode = 'normal' | 'exam';

// Notification types
export type NotificationType = 'exam_mode' | 'locker_locked' | 'locker_unlocked' | 'info' | 'system';

// Database Locker entity (matches Supabase table)
export interface DbLocker {
  id: string;
  student_id: string | null;
  student_name: string;
  status: string;
  location: string;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

// Locker entity (frontend format)
export interface Locker {
  id: string;
  studentId: string | null;
  studentName: string;
  status: LockerStatus;
  location: string;
}

// Database Activity log entry (matches Supabase table)
export interface DbLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role: 'student' | 'teacher';
  action: string;
  details: string | null;
  created_at: string;
}

// Activity log entry (frontend format)
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

// System settings
export interface SystemSettings {
  exam_mode: {
    enabled: boolean;
  };
}

// Helper to convert database locker to frontend format
export const dbLockerToLocker = (dbLocker: DbLocker): Locker => ({
  id: dbLocker.id,
  studentId: dbLocker.student_id,
  studentName: dbLocker.student_name,
  status: dbLocker.status as LockerStatus,
  location: dbLocker.location,
});

// Helper to convert database log to frontend format
export const dbLogToLogEntry = (dbLog: DbLogEntry): LogEntry => ({
  id: dbLog.id,
  timestamp: new Date(dbLog.created_at),
  userId: dbLog.user_id,
  userName: dbLog.user_name,
  userRole: dbLog.user_role,
  action: dbLog.action,
  details: dbLog.details || '',
});
