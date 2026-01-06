/**
 * ClassManagement Component
 * Allows teachers to manage classes and enroll students
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Users, 
  Trash2, 
  Edit, 
  Loader2,
  UserPlus,
  GraduationCap,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Class {
  id: string;
  name: string;
  year: number;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  username: string;
}

interface StudentClass {
  id: string;
  student_id: string;
  class_id: string;
}

const ClassManagement: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [enrollClassId, setEnrollClassId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesRes, studentsRes, enrollmentsRes] = await Promise.all([
        supabase.from('classes').select('*').order('year', { ascending: false }),
        supabase.from('profiles').select('id, name, username'),
        supabase.from('student_classes').select('*'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;

      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
      setStudentClasses(enrollmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load class data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get students enrolled in a class
  const getEnrolledStudents = useCallback((classId: string) => {
    const enrolledIds = studentClasses
      .filter(sc => sc.class_id === classId)
      .map(sc => sc.student_id);
    return students.filter(s => enrolledIds.includes(s.id));
  }, [studentClasses, students]);

  // Filter students for search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.username.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Add new class
  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('classes').insert({
        name: newClassName.trim(),
        year: new Date().getFullYear(),
      });

      if (error) throw error;

      toast.success('Class created successfully');
      setNewClassName('');
      setIsAddClassOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit class
  const handleEditClass = async () => {
    if (!editClass || !editClass.name.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({ name: editClass.name.trim() })
        .eq('id', editClass.id);

      if (error) throw error;

      toast.success('Class updated successfully');
      setEditClass(null);
      setIsEditClassOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Failed to update class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete class
  const handleDeleteClass = async () => {
    if (!deleteClassId) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', deleteClassId);

      if (error) throw error;

      toast.success('Class deleted successfully');
      setDeleteClassId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  // Open enroll dialog
  const openEnrollDialog = (classId: string) => {
    setEnrollClassId(classId);
    const currentEnrolled = studentClasses
      .filter(sc => sc.class_id === classId)
      .map(sc => sc.student_id);
    setSelectedStudents(currentEnrolled);
    setSearchTerm('');
    setIsEnrollOpen(true);
  };

  // Save enrollments
  const handleSaveEnrollments = async () => {
    if (!enrollClassId) return;

    setIsSubmitting(true);
    try {
      // Get current enrollments for this class
      const currentEnrolled = studentClasses
        .filter(sc => sc.class_id === enrollClassId)
        .map(sc => sc.student_id);

      // Find students to add and remove
      const toAdd = selectedStudents.filter(id => !currentEnrolled.includes(id));
      const toRemove = currentEnrolled.filter(id => !selectedStudents.includes(id));

      // Remove unenrolled students
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('student_classes')
          .delete()
          .eq('class_id', enrollClassId)
          .in('student_id', toRemove);
        if (error) throw error;
      }

      // Add new enrollments
      if (toAdd.length > 0) {
        const { error } = await supabase.from('student_classes').insert(
          toAdd.map(studentId => ({
            class_id: enrollClassId,
            student_id: studentId,
          }))
        );
        if (error) throw error;
      }

      toast.success('Enrollments updated successfully');
      setIsEnrollOpen(false);
      setEnrollClassId(null);
      setSelectedStudents([]);
      fetchData();
    } catch (error) {
      console.error('Error updating enrollments:', error);
      toast.error('Failed to update enrollments');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Remove student from class
  const handleRemoveStudent = async (classId: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from('student_classes')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);

      if (error) throw error;

      toast.success('Student removed from class');
      fetchData();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap size={24} className="text-primary" />
            Class Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage classes and student enrollments
          </p>
        </div>
        
        {/* Add Class Dialog */}
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class for the current academic year
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  placeholder="e.g., 10th Grade - Section A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClass} disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes List */}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <GraduationCap size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No classes yet</p>
            <p className="text-sm">Create your first class to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {classes.map((cls) => {
            const enrolled = getEnrolledStudents(cls.id);
            return (
              <AccordionItem key={cls.id} value={cls.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={18} className="text-primary" />
                      <span className="font-medium">{cls.name}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <Users size={12} className="mr-1" />
                      {enrolled.length} students
                    </Badge>
                    <Badge variant="outline" className="ml-1">
                      {cls.year}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {/* Class Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => openEnrollDialog(cls.id)}
                      >
                        <UserPlus size={14} className="mr-1" />
                        Manage Students
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditClass(cls);
                          setIsEditClassOpen(true);
                        }}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteClassId(cls.id)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>

                    {/* Enrolled Students */}
                    {enrolled.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {enrolled.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Users size={14} className="text-muted-foreground shrink-0" />
                              <span className="text-sm truncate">{student.name}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleRemoveStudent(cls.id, student.id)}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No students enrolled yet. Click "Manage Students" to add students.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Edit Class Dialog */}
      <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update the class name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class-name">Class Name</Label>
              <Input
                id="edit-class-name"
                value={editClass?.name || ''}
                onChange={(e) => setEditClass(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClassOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClass} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Students Dialog */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Student Enrollment</DialogTitle>
            <DialogDescription>
              Select students to enroll in this class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No students found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <p className="text-sm text-muted-foreground text-center">
              {selectedStudents.length} student(s) selected
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEnrollments} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Save Enrollments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClassId} onOpenChange={() => setDeleteClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the class and all student enrollments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass}>
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassManagement;
