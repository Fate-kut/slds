/**
 * StudentDashboard Page Component
 * Main interface for students to manage their locker and use the smart desk
 * Shows locker status, desk mode, and available actions
 */

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { LockerCard } from '@/components/LockerCard';
import { DeskInterface } from '@/components/DeskInterface';
import { ActivityLog } from '@/components/ActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Backpack, Clock, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

/**
 * StudentDashboard Component
 * Renders the student's main interface with locker and desk controls
 */
const StudentDashboard: React.FC = () => {
  const { currentUser, lockers, logs, toggleLocker } = useApp();

  // Find the student's assigned locker
  const myLocker = lockers.find(l => l.id === currentUser?.locker_id);

  // Filter logs to show only this student's actions
  const myLogs = logs.filter(log => log.userId === currentUser?.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome section */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <Backpack className="text-primary" size={28} />
            <h1 className="text-2xl font-bold">Welcome, {currentUser?.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {format(new Date(), 'h:mm a')}
            </span>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Locker and quick info */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* My Locker */}
            {myLocker ? (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-primary rounded-full" />
                  My Locker
                </h2>
                <LockerCard
                  locker={myLocker}
                  isOwner={true}
                  onToggle={() => toggleLocker(myLocker.id)}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Backpack size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No locker assigned</p>
                  <p className="text-sm">Contact your teacher for locker assignment</p>
                </CardContent>
              </Card>
            )}

            {/* Quick stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  Today's Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {myLogs.filter(l => l.action.includes('LOCKER')).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Locker Actions</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {myLogs.filter(l => l.action.includes('RESEARCH') || l.action.includes('EXAM_ACTION')).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Desk Actions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center column - Smart Desk */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                Smart Desk
              </h2>
              <DeskInterface />
            </div>

            {/* Activity log */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                My Activity
              </h2>
              <ActivityLog 
                logs={myLogs} 
                maxHeight="250px"
                title="Recent Actions"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
