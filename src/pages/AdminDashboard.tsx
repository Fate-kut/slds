/**
 * AdminDashboard Page Component
 * Comprehensive control panel for administrators to manage the entire locker system
 */

import React, { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Clock, 
  Calendar, 
  Lock, 
  LockOpen,
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
  LayoutDashboard,
  Settings,
  Activity,
  UserCheck,
  UserX,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * AdminDashboard Component
 * Renders the administrator's control panel with full system management
 */
const AdminDashboard: React.FC = () => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [lockerFilter, setLockerFilter] = useState<'all' | 'locked' | 'unlocked' | 'assigned' | 'unassigned'>('all');

  // Calculate statistics
  const stats = useMemo(() => {
    const locked = lockers.filter(l => l.status === 'locked').length;
    const unlocked = lockers.filter(l => l.status === 'unlocked').length;
    const assigned = lockers.filter(l => l.studentId).length;
    const unassigned = lockers.filter(l => !l.studentId).length;
    const activeStudents = students.filter(s => lockers.some(l => l.studentId === s.id)).length;
    
    return { locked, unlocked, assigned, unassigned, total: lockers.length, activeStudents, totalStudents: students.length };
  }, [lockers, students]);

  // Filter lockers based on search and filter
  const filteredLockers = useMemo(() => {
    return lockers.filter(locker => {
      const matchesSearch = searchQuery === '' || 
        locker.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locker.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locker.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        lockerFilter === 'all' ||
        (lockerFilter === 'locked' && locker.status === 'locked') ||
        (lockerFilter === 'unlocked' && locker.status === 'unlocked') ||
        (lockerFilter === 'assigned' && locker.studentId) ||
        (lockerFilter === 'unassigned' && !locker.studentId);
      
      return matchesSearch && matchesFilter;
    });
  }, [lockers, searchQuery, lockerFilter]);

  // Handler functions
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

  const handleLockAll = () => {
    lockAllLockers();
    toast.success('Emergency Lock Activated', {
      description: 'All lockers have been secured'
    });
  };

  const handleUnlockAll = () => {
    lockers.forEach(locker => {
      if (locker.status === 'locked') {
        unlockLocker(locker.id);
      }
    });
    toast.success('All Lockers Unlocked', {
      description: 'All lockers have been released'
    });
  };

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
            <Shield className="text-primary" size={28} />
            <h1 className="text-2xl font-bold">Admin Control Panel</h1>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-slide-up">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Lockers</p>
                </div>
                <LayoutDashboard className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.locked}</p>
                  <p className="text-xs text-muted-foreground">Locked</p>
                </div>
                <Lock className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.unlocked}</p>
                  <p className="text-xs text-muted-foreground">Unlocked</p>
                </div>
                <LockOpen className="h-8 w-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <UserX className="h-8 w-8 text-orange-600/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="lockers" className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="lockers" className="gap-2">
              <Lock size={16} />
              <span className="hidden sm:inline">Lockers</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <BookOpen size={16} />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity size={16} />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Lockers Tab */}
          <TabsContent value="lockers" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search lockers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={lockerFilter} onValueChange={(v) => setLockerFilter(v as typeof lockerFilter)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="unlocked">Unlocked</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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

            {filteredLockers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Lock size={48} className="mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No lockers found</p>
                  <p className="text-sm">{searchQuery || lockerFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first locker to get started'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLockers.map(locker => (
                  <div key={locker.id} className="relative group">
                    <LockerCard
                      locker={locker}
                      showTeacherControls={true}
                      onLock={() => lockLocker(locker.id)}
                      onUnlock={() => unlockLocker(locker.id)}
                    />
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  User Directory
                </CardTitle>
                <CardDescription>
                  Monitor all registered users and their locker assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users size={48} className="mx-auto mb-4 opacity-40" />
                    <p>No users registered yet</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Locker</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => {
                          const assignedLocker = lockers.find(l => l.studentId === student.id);
                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>
                                {assignedLocker ? (
                                  <span className="text-sm">{assignedLocker.id}</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No locker assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {assignedLocker ? (
                                  <Badge variant={assignedLocker.status === 'locked' ? 'destructive' : 'default'}>
                                    {assignedLocker.status === 'locked' ? (
                                      <><Lock size={12} className="mr-1" /> Locked</>
                                    ) : (
                                      <><LockOpen size={12} className="mr-1" /> Unlocked</>
                                    )}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Inactive</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="mt-4">
            <MaterialUploader />
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Restrict student desk access during examinations
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

              {/* Emergency Controls */}
              <Card className="border-2 border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck size={18} className="text-destructive" />
                    Emergency Controls
                  </CardTitle>
                  <CardDescription>
                    Override locker access for safety and operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleLockAll}
                  >
                    <Lock size={16} className="mr-2" />
                    Emergency Lock All
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleUnlockAll}
                  >
                    <LockOpen size={16} className="mr-2" />
                    Unlock All Lockers
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="bg-secondary/50 border-dashed">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    {examMode ? (
                      <AlertTriangle size={16} className="text-warning" />
                    ) : (
                      <CheckCircle2 size={16} className="text-green-500" />
                    )}
                    <span>
                      System Status: {examMode ? 'Exam Mode Active' : 'Normal Operation'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-muted-foreground" />
                    <span>{stats.locked} of {stats.total} lockers secured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-muted-foreground" />
                    <span>{stats.activeStudents} active users</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <ActivityLog 
              logs={logs} 
              maxHeight="600px"
              title="System Activity Log"
            />
          </TabsContent>
        </Tabs>

        {/* Edit Locker Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Locker</DialogTitle>
              <DialogDescription>
                Update locker information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Locker ID</Label>
                <Input value={selectedLocker?.id || ''} disabled />
              </div>
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
                <Label htmlFor="assign-student">Select Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        <AlertDialog open={!!deleteConfirmLocker} onOpenChange={(open) => !open && setDeleteConfirmLocker(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Locker?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove locker {deleteConfirmLocker} from the system. This action cannot be undone.
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
      </main>
    </div>
  );
};

export default AdminDashboard;
