/**
 * Initial mock data for the Smart Locker Desk System
 * User authentication is now handled by Supabase Auth
 * This file only contains initial locker data for the simulation
 */

import { Locker } from '@/types';

// Pre-defined lockers for the simulation
// Each locker can be assigned to a student
export const initialLockers: Locker[] = [
  {
    id: 'locker-A1',
    studentId: null,
    studentName: 'Unassigned',
    status: 'locked',
    location: 'Row A, Position 1',
  },
  {
    id: 'locker-A2',
    studentId: null,
    studentName: 'Unassigned',
    status: 'locked',
    location: 'Row A, Position 2',
  },
  {
    id: 'locker-B1',
    studentId: null,
    studentName: 'Unassigned',
    status: 'locked',
    location: 'Row B, Position 1',
  },
  {
    id: 'locker-B2',
    studentId: null,
    studentName: 'Unassigned',
    status: 'locked',
    location: 'Row B, Position 2',
  },
];
