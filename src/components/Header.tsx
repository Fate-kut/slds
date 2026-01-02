/**
 * Header Component
 * Application header with user info and logout functionality
 * Shows current user role and system status
 */

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import NotificationBell from './NotificationBell';
import { LogOut, Shield, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

/**
 * Header Component
 * Displays app branding, user info, and navigation
 */
export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { currentUser, examMode, logout } = useApp();

  return (
    <header 
      className={cn(
        'bg-card border-b border-border sticky top-0 z-50',
        'backdrop-blur-sm bg-card/95',
        className
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="text-primary-foreground" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Smart Locker System</h1>
            <p className="text-xs text-muted-foreground">Classroom Access Control</p>
          </div>
        </div>

        {/* User info and controls */}
        {currentUser && (
          <div className="flex items-center gap-4">
            {/* Exam mode indicator */}
            {examMode && (
              <StatusBadge 
                variant="exam" 
                label="Exam Mode Active"
                size="md"
                className="animate-pulse-glow"
              />
            )}
            
            {/* Notification bell for students */}
            {currentUser.role === 'student' && (
              <NotificationBell />
            )}
            
            {/* User badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
              {currentUser.role === 'teacher' ? (
                <GraduationCap size={16} className="text-primary" />
              ) : (
                <User size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm font-medium">{currentUser.name}</span>
              <span 
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  currentUser.role === 'teacher' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentUser.role}
              </span>
            </div>
            
            {/* Logout button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="gap-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
