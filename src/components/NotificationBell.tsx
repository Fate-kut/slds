/**
 * NotificationBell Component
 * Displays notification icon with unread count and dropdown list
 * Used to alert students about exam mode and locker changes
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Lock, Unlock, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Get icon for notification type
 */
const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'exam_mode':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'locker_locked':
      return <Lock className="h-4 w-4 text-destructive" />;
    case 'locker_unlocked':
      return <Unlock className="h-4 w-4 text-success" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

/**
 * Format timestamp for display
 */
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
};

const NotificationBell: React.FC = () => {
  const { notifications, markNotificationRead, clearNotifications } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Mark notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      notifications.forEach(n => {
        if (!n.read) {
          markNotificationRead(n.id);
        }
      });
    }
  }, [isOpen, notifications, unreadCount, markNotificationRead]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={clearNotifications}
              >
                Clear all
              </Button>
            )}
          </div>
          
          {/* Notification List */}
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 hover:bg-muted/50 transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
