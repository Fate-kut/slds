/**
 * LockerCard Component
 * Displays a single locker with its status and controls
 * Used in both student and teacher dashboards
 */

import React from 'react';
import { Locker } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockerCardProps {
  locker: Locker;
  // Whether this is the current user's locker
  isOwner?: boolean;
  // Callback for toggling locker status
  onToggle?: () => void;
  // Callback for locking (teacher only)
  onLock?: () => void;
  // Callback for unlocking (teacher only)
  onUnlock?: () => void;
  // Whether to show teacher controls
  showTeacherControls?: boolean;
  className?: string;
}

/**
 * LockerCard Component
 * Renders a visual representation of a locker with controls
 */
export const LockerCard: React.FC<LockerCardProps> = ({
  locker,
  isOwner = false,
  onToggle,
  onLock,
  onUnlock,
  showTeacherControls = false,
  className,
}) => {
  const isLocked = locker.status === 'locked';
  
  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-card-hover',
        isOwner && 'ring-2 ring-primary/30',
        className
      )}
    >
      {/* Visual indicator bar at top */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 h-1',
          isLocked ? 'bg-danger' : 'bg-success'
        )}
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {/* Locker icon with status color */}
              <div 
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isLocked ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                )}
              >
                {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <span>{locker.id}</span>
            </CardTitle>
          </div>
          <StatusBadge variant={isLocked ? 'locked' : 'unlocked'} size="sm" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Locker details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={14} />
            <span>{locker.location}</span>
          </div>
          {locker.studentName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={14} />
              <span>{locker.studentName}</span>
              {isOwner && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Your Locker
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">
          {/* Owner toggle button */}
          {isOwner && onToggle && (
            <Button
              onClick={onToggle}
              variant={isLocked ? 'default' : 'secondary'}
              className="flex-1"
            >
              {isLocked ? (
                <>
                  <Unlock size={16} className="mr-2" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock size={16} className="mr-2" />
                  Lock
                </>
              )}
            </Button>
          )}
          
          {/* Teacher controls */}
          {showTeacherControls && (
            <div className="flex gap-2 w-full">
              <Button
                onClick={onUnlock}
                variant="outline"
                size="sm"
                disabled={!isLocked}
                className="flex-1"
              >
                <Unlock size={14} className="mr-1" />
                Unlock
              </Button>
              <Button
                onClick={onLock}
                variant="outline"
                size="sm"
                disabled={isLocked}
                className="flex-1"
              >
                <Lock size={14} className="mr-1" />
                Lock
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LockerCard;
