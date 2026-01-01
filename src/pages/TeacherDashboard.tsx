/**
 * TeacherDashboard Page Component
 * Control panel for teachers to manage exam mode and monitor students
 * Provides global controls and real-time status of all lockers
 */

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { LockerCard } from '@/components/LockerCard';
import { ActivityLog } from '@/components/ActivityLog';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  GraduationCap, 
  Clock, 
  Calendar, 
  Lock, 
  Users, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * TeacherDashboard Component
 * Renders the teacher's control panel with student monitoring and exam controls
 */
const TeacherDashboard: React.FC = () => {
  const { 
    currentUser, 
    lockers, 
    examMode, 
    logs,
    toggleExamMode,
    lockAllLockers,
    lockLocker,
    unlockLocker
  } = useApp();

  // Calculate statistics
  const lockedCount = lockers.filter(l => l.status === 'locked').length;
  const unlockedCount = lockers.filter(l => l.status === 'unlocked').length;

  /**
   * Handle exam mode toggle with confirmation
   */
  const handleExamModeToggle = () => {
    toggleExamMode();
    toast.success(
      examMode ? 'Exam Mode Disabled' : 'Exam Mode Enabled',
      {
        description: examMode 
          ? 'Students can now access all desk features' 
          : 'Student desk access is now restricted',
      }
    );
  };

  /**
   * Handle lock all lockers action
   */
  const handleLockAll = () => {
    lockAllLockers();
    toast.success('All Lockers Locked', {
      description: 'Emergency lockdown completed successfully',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome section */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="text-primary" size={28} />
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
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

        {/* Control panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          {/* Exam Mode Control */}
          <Card className={cn(
            'border-2 transition-all duration-300',
            examMode ? 'border-warning bg-warning/5' : 'border-border'
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={18} className={examMode ? 'text-warning' : 'text-muted-foreground'} />
                Exam Mode
              </CardTitle>
              <CardDescription>
                Restrict student desk access during exams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id="exam-mode"
                    checked={examMode}
                    onCheckedChange={handleExamModeToggle}
                  />
                  <Label htmlFor="exam-mode" className="cursor-pointer">
                    {examMode ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <StatusBadge 
                  variant={examMode ? 'exam' : 'normal'} 
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Locker Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock size={18} className="text-muted-foreground" />
                Locker Status
              </CardTitle>
              <CardDescription>
                Overview of all student lockers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span className="text-sm">{lockedCount} Locked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm">{unlockedCount} Unlocked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Controls */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-muted-foreground" />
                Emergency Controls
              </CardTitle>
              <CardDescription>
                Quick actions for security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLockAll}
              >
                <Lock size={16} className="mr-2" />
                Lock All Lockers
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Student Lockers */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                Student Lockers
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={16} />
                {lockers.length} students
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lockers.map(locker => (
                <LockerCard
                  key={locker.id}
                  locker={locker}
                  showTeacherControls={true}
                  onLock={() => lockLocker(locker.id)}
                  onUnlock={() => unlockLocker(locker.id)}
                />
              ))}
            </div>
          </div>

          {/* Right column - Activity Log */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />
              System Activity
            </h2>
            <ActivityLog 
              logs={logs} 
              maxHeight="600px"
              title="All Actions"
            />
          </div>
        </div>

        {/* System status footer */}
        <Card className="bg-secondary/50 border-dashed animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                {examMode ? (
                  <AlertTriangle size={16} className="text-warning" />
                ) : (
                  <CheckCircle2 size={16} className="text-success" />
                )}
                <span>
                  System Status: {examMode ? 'Exam Mode Active' : 'Normal Operation'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={14} />
                <span>Last updated: {format(new Date(), 'h:mm:ss a')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeacherDashboard;
