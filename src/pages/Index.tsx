/**
 * Index Page Component
 * Router component that redirects users based on authentication status and role
 * Acts as the main entry point after login
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

/**
 * Index Component
 * Redirects authenticated users to their role-specific dashboard
 * Redirects unauthenticated users to login page
 */
const Index: React.FC = () => {
  const { currentUser } = useApp();

  // If not logged in, redirect to auth page
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on user role
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (currentUser.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }

  return <Navigate to="/student" replace />;
};

export default Index;
