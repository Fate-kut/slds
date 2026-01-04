/**
 * TeacherDashboard Page Component
 * Control panel for teachers to manage exam mode and monitor students
 * Provides global controls and real-time status of all lockers
 */

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { LockerCard } from '@/components/LockerCard';
import { ActivityLog } from '@/components/ActivityLog';
import { StatusBadge } from '@/components/StatusBadge';
import { MaterialUploader } from '@/components/LearningLibrary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  GraduationCap, 
  Clock, 
  Calendar, 
  Lock, 
  Users, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  Loader2,
  UserPlus,
  BookOpen,
  LayoutDashboard,
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
    isLoading,
    students,
    toggleExamMode,
    lockAllLockers,
    lockLocker,
    unlockLocker,
    addLocker,
    updateLocker,
    deleteLocker,
    assignLocker,
  } = useApp();

  // State for locker management dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [deleteConfirmLocker, setDeleteConfirmLocker] = useState<string | null>(null);
  const [selectedLocker, setSelectedLocker] = useState<{ id: string; studentName: string; location: string; studentId: string | null } | null>(null);
  const [newLocker, setNewLocker] = useState({ id: '', studentName: 'Unassigned', location: '' });
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  };

  /**
   * Handle adding a new locker
   */
  const handleAddLocker = async () => {
    if (!newLocker.id || !newLocker.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    const success = await addLocker({
      id: newLocker.id,
      studentId: null,
      studentName: newLocker.studentName || 'Unassigned',
      location: newLocker.location,
    });
    setIsSubmitting(false);
    
    if (success) {
      toast.success('Locker Added', { description: `Locker ${newLocker.id} has been created` });
      setNewLocker({ id: '', studentName: 'Unassigned', location: '' });
      setIsAddDialogOpen(false);
    }
  };

  /**
   * Handle editing a locker
   */
  const handleEditLocker = async () => {
    if (!selectedLocker) return;
    
    setIsSubmitting(true);
    const success = await updateLocker(selectedLocker.id, {
      location: selectedLocker.location,
    });
    setIsSubmitting(false);
    
    if (success) {
      toast.success('Locker Updated', { description: `Locker ${selectedLocker.id} has been updated` });
      setSelectedLocker(null);
      setIsEditDialogOpen(false);
    }
  };

  /**
   * Handle assigning a locker to a student
   */
  const handleAssignLocker = async () => {
    if (!selectedLocker) return;
    
    setIsSubmitting(true);
    const studentId = selectedStudentId === 'unassigned' ? null : selectedStudentId;
    const success = await assignLocker(selectedLocker.id, studentId);
    setIsSubmitting(false);
    
    if (success) {
      const studentName = studentId 
        ? students.find(s => s.id === studentId)?.name || 'Student'
        : 'Unassigned';
      toast.success('Locker Assigned', { description: `Locker ${selectedLocker.id} assigned to ${studentName}` });
      setSelectedLocker(null);
      setSelectedStudentId('');
      setIsAssignDialogOpen(false);
    }
  };

  /**
   * Handle deleting a locker
   */
  const handleDeleteLocker = async () => {
    if (!deleteConfirmLocker) return;
    
    const success = await deleteLocker(deleteConfirmLocker);
    
    if (success) {
      toast.success('Locker Deleted', { description: `Locker ${deleteConfirmLocker} has been removed` });
    }
    setDeleteConfirmLocker(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="animate-slide-up">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <BookOpen size={16} />
              Materials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">

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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={16} />
                  {lockers.length} lockers
                </div>
                
                {/* Add Locker Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus size={16} className="mr-1" />
                      Add Locker
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Locker</DialogTitle>
                      <DialogDescription>
                        Create a new locker in the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="locker-id">Locker ID *</Label>
                        <Input
                          id="locker-id"
                          placeholder="e.g., locker-C1"
                          value={newLocker.id}
                          onChange={(e) => setNewLocker({ ...newLocker, id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locker-location">Location *</Label>
                        <Input
                          id="locker-location"
                          placeholder="e.g., Row C, Position 1"
                          value={newLocker.location}
                          onChange={(e) => setNewLocker({ ...newLocker, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-name">Assigned Student</Label>
                        <Input
                          id="student-name"
                          placeholder="Leave empty for unassigned"
                          value={newLocker.studentName}
                          onChange={(e) => setNewLocker({ ...newLocker, studentName: e.target.value || 'Unassigned' })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddLocker} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                        Add Locker
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {lockers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Lock size={48} className="mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No lockers configured</p>
                  <p className="text-sm">Add your first locker to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lockers.map(locker => (
                  <div key={locker.id} className="relative group">
                    <LockerCard
                      locker={locker}
                      showTeacherControls={true}
                      onLock={() => lockLocker(locker.id)}
                      onUnlock={() => unlockLocker(locker.id)}
                    />
                    {/* Edit/Delete/Assign buttons overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Assign to student"
                        onClick={() => {
                          setSelectedLocker({
                            id: locker.id,
                            studentName: locker.studentName,
                            location: locker.location,
                            studentId: locker.studentId,
                          });
                          setSelectedStudentId(locker.studentId || 'unassigned');
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Edit locker"
                        onClick={() => {
                          setSelectedLocker({
                            id: locker.id,
                            studentName: locker.studentName,
                            location: locker.location,
                            studentId: locker.studentId,
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        title="Delete locker"
                        onClick={() => setDeleteConfirmLocker(locker.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          </TabsContent>

          <TabsContent value="materials">
            <MaterialUploader />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Locker Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Locker</DialogTitle>
            <DialogDescription>
              Update locker {selectedLocker?.id} settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={selectedLocker?.location || ''}
                onChange={(e) => setSelectedLocker(prev => prev ? { ...prev, location: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLocker} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Locker Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Locker</DialogTitle>
            <DialogDescription>
              Assign locker {selectedLocker?.id} to a student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Assignment</Label>
              <p className="text-sm text-muted-foreground">
                {selectedLocker?.studentName || 'Unassigned'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-student">Assign to Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="assign-student">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {students.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No registered students found
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignLocker} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Assign Locker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmLocker} onOpenChange={() => setDeleteConfirmLocker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Locker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete locker {deleteConfirmLocker}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocker} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherDashboard;
