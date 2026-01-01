/**
 * Main Application Component
 * Sets up routing, context providers, and global UI components
 * Handles navigation based on authentication state
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";

// Page imports
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import NotFound from "./pages/NotFound";

// Create React Query client
const queryClient = new QueryClient();

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: ('student' | 'teacher')[];
}> = ({ children, allowedRoles }) => {
  const { currentUser } = useApp();

  // Redirect to auth if not logged in
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // Check role permissions if specified
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * AuthRoute Component
 * Wraps auth page - redirects to dashboard if already logged in
 */
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();

  // Redirect to appropriate dashboard if already logged in
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * AppRoutes Component
 * Defines all application routes with proper protection
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Index - redirects based on auth state */}
      <Route path="/" element={<Index />} />
      
      {/* Auth page - accessible only when not logged in */}
      <Route 
        path="/auth" 
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        } 
      />
      
      {/* Student dashboard - protected, students only */}
      <Route 
        path="/student" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher dashboard - protected, teachers only */}
      <Route 
        path="/teacher" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/**
 * App Component
 * Root component with all providers
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
