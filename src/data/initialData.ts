/**
 * Initial mock data for the Smart Locker Desk System
 * This simulates a database with pre-populated users and lockers
 */

import { User, Locker } from '@/types';

// Pre-defined users for the simulation
// In a real system, these would come from a database
export const initialUsers: User[] = [
  {
    id: 'student-001',
    username: 'john.doe',
    role: 'student',
    name: 'John Doe',
    lockerId: 'locker-A1',
  },
  {
    id: 'student-002',
    username: 'jane.smith',
    role: 'student',
    name: 'Jane Smith',
    lockerId: 'locker-A2',
  },
  {
    id: 'student-003',
    username: 'mike.wilson',
    role: 'student',
    name: 'Mike Wilson',
    lockerId: 'locker-B1',
  },
  {
    id: 'student-004',
    username: 'sarah.jones',
    role: 'student',
    name: 'Sarah Jones',
    lockerId: 'locker-B2',
  },
  {
    id: 'teacher-001',
    username: 'prof.anderson',
    role: 'teacher',
    name: 'Prof. Anderson',
  },
  {
    id: 'teacher-002',
    username: 'dr.chen',
    role: 'teacher',
    name: 'Dr. Chen',
  },
];

// Pre-defined lockers for the simulation
// Each locker is assigned to a student
export const initialLockers: Locker[] = [
  {
    id: 'locker-A1',
    studentId: 'student-001',
    studentName: 'John Doe',
    status: 'locked',
    location: 'Row A, Position 1',
  },
  {
    id: 'locker-A2',
    studentId: 'student-002',
    studentName: 'Jane Smith',
    status: 'locked',
    location: 'Row A, Position 2',
  },
  {
    id: 'locker-B1',
    studentId: 'student-003',
    studentName: 'Mike Wilson',
    status: 'locked',
    location: 'Row B, Position 1',
  },
  {
    id: 'locker-B2',
    studentId: 'student-004',
    studentName: 'Sarah Jones',
    status: 'locked',
    location: 'Row B, Position 2',
  },
];

// Valid PIN codes for authentication simulation
// In a real system, these would be hashed and stored securely
export const userCredentials: Record<string, string> = {
  'john.doe': '1234',
  'jane.smith': '2345',
  'mike.wilson': '3456',
  'sarah.jones': '4567',
  'prof.anderson': '9999',
  'dr.chen': '8888',
};
