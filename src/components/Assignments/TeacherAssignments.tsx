/**
 * Teacher Assignments Management Component
 * Create, edit, delete assignments and grade submissions
 */

import React, { useState, useEffect } from 'react';
import { useAssignments, Assignment } from '@/hooks/useAssignments';
import { useGrades } from '@/hooks/useGrades';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  FileText,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  Award,
  Send,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

const TeacherAssignments: React.FC = () => {
  const {
    assignments,
    isLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  } = useAssignments();
  const { getAssignmentSubmissions, gradeSubmission, updateGrade, publishGrades } = useGrades();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    class_id: '',
    due_date: '',
    allow_late_submission: false,
    max_score: 100,
  });

  const [gradeData, setGradeData] = useState<Record<string, { score: number; feedback: string }>>({});

  useEffect(() => {
    const fetchData = async () => {
      const [classesRes, subjectsRes] = await Promise.all([
        supabase.from('classes').select('id, name'),
        supabase.from('subjects').select('id, name, code'),
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject_id: '',
      class_id: '',
      due_date: '',
      allow_late_submission: false,
      max_score: 100,
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.class_id || !formData.due_date) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    const success = await createAssignment({
      title: formData.title,
      description: formData.description || undefined,
      subject_id: formData.subject_id || undefined,
      class_id: formData.class_id,
      due_date: new Date(formData.due_date).toISOString(),
      allow_late_submission: formData.allow_late_submission,
      max_score: formData.max_score,
    });
    setIsSubmitting(false);

    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;

    setIsSubmitting(true);
    const success = await updateAssignment(editingAssignment.id, {
      title: formData.title,
      description: formData.description || null,
      subject_id: formData.subject_id || null,
      due_date: new Date(formData.due_date).toISOString(),
      allow_late_submission: formData.allow_late_submission,
      max_score: formData.max_score,
    });
    setIsSubmitting(false);

    if (success) {
      setEditingAssignment(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteAssignment(deleteConfirm);
    setDeleteConfirm(null);
  };

  const openGrading = async (assignment: Assignment) => {
    setGradingAssignment(assignment);
    const subs = await getAssignmentSubmissions(assignment.id);
    setSubmissions(subs);
    
    // Initialize grade data
    const initial: Record<string, { score: number; feedback: string }> = {};
    subs.forEach(sub => {
      initial[sub.id] = {
        score: sub.grade?.score || 0,
        feedback: sub.grade?.feedback || '',
      };
    });
    setGradeData(initial);
  };

  const handleGradeSubmission = async (submission: any) => {
    const data = gradeData[submission.id];
    if (!gradingAssignment || data.score === undefined) return;

    if (submission.grade) {
      await updateGrade(submission.grade.id, {
        score: data.score,
        feedback: data.feedback,
      });
    } else {
      await gradeSubmission({
        student_id: submission.student_id,
        assignment_submission_id: submission.id,
        score: data.score,
        max_score: gradingAssignment.max_score,
        feedback: data.feedback,
      });
    }

    // Refresh submissions
    const subs = await getAssignmentSubmissions(gradingAssignment.id);
    setSubmissions(subs);
  };

  const handlePublishGrades = async () => {
    const gradeIds = submissions
      .filter(s => s.grade && !s.grade.is_published)
      .map(s => s.grade.id);
    
    if (gradeIds.length > 0) {
      await publishGrades(gradeIds);
      if (gradingAssignment) {
        const subs = await getAssignmentSubmissions(gradingAssignment.id);
        setSubmissions(subs);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Assignments
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus size={16} className="mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Create a new assignment for students</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment instructions..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(v) => setFormData({ ...formData, class_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_score">Max Score</Label>
                  <Input
                    id="max_score"
                    type="number"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="late"
                  checked={formData.allow_late_submission}
                  onCheckedChange={(c) => setFormData({ ...formData, allow_late_submission: c })}
                />
                <Label htmlFor="late">Allow late submissions</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No assignments yet</p>
            <p className="text-sm">Create your first assignment to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map(assignment => {
            const isPastDue = isPast(new Date(assignment.due_date));

            return (
              <Card key={assignment.id} className="relative group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    {isPastDue ? (
                      <Badge variant="secondary">Closed</Badge>
                    ) : (
                      <Badge className="bg-success">Active</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {assignment.subject?.name || 'No subject'} • {assignment.class?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Award size={14} />
                      Max Score: {assignment.max_score}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openGrading(assignment)}
                    >
                      <Users size={14} className="mr-1" />
                      Grade
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setFormData({
                          title: assignment.title,
                          description: assignment.description || '',
                          subject_id: assignment.subject_id || '',
                          class_id: assignment.class_id,
                          due_date: format(new Date(assignment.due_date), "yyyy-MM-dd'T'HH:mm"),
                          allow_late_submission: assignment.allow_late_submission,
                          max_score: assignment.max_score,
                        });
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteConfirm(assignment.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Due Date *</Label>
                <Input
                  id="edit-due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max_score">Max Score</Label>
                <Input
                  id="edit-max_score"
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-late"
                checked={formData.allow_late_submission}
                onCheckedChange={(c) => setFormData({ ...formData, allow_late_submission: c })}
              />
              <Label htmlFor="edit-late">Allow late submissions</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAssignment(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={!!gradingAssignment} onOpenChange={() => setGradingAssignment(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Grade Submissions: {gradingAssignment?.title}</DialogTitle>
            <DialogDescription>
              Review and grade student submissions
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {submissions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users size={40} className="mx-auto mb-3 opacity-40" />
                <p>No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => (
                  <Card key={sub.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{sub.student?.name || 'Unknown Student'}</CardTitle>
                        <div className="flex items-center gap-2">
                          {sub.is_late && (
                            <Badge variant="outline" className="text-warning border-warning">Late</Badge>
                          )}
                          {sub.grade?.is_published && (
                            <Badge className="bg-success">Published</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        Submitted: {format(new Date(sub.submitted_at), 'MMM d, yyyy h:mm a')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {sub.content || 'No content provided'}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Score (max {gradingAssignment?.max_score})</Label>
                          <Input
                            type="number"
                            min={0}
                            max={gradingAssignment?.max_score}
                            value={gradeData[sub.id]?.score || 0}
                            onChange={(e) => setGradeData(prev => ({
                              ...prev,
                              [sub.id]: { ...prev[sub.id], score: parseInt(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Feedback</Label>
                          <Input
                            value={gradeData[sub.id]?.feedback || ''}
                            onChange={(e) => setGradeData(prev => ({
                              ...prev,
                              [sub.id]: { ...prev[sub.id], feedback: e.target.value }
                            }))}
                            placeholder="Add feedback..."
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleGradeSubmission(sub)}
                      >
                        <CheckCircle2 size={14} className="mr-1" />
                        {sub.grade ? 'Update Grade' : 'Save Grade'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradingAssignment(null)}>Close</Button>
            <Button onClick={handlePublishGrades}>
              <Send size={14} className="mr-2" />
              Publish All Grades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment and all submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherAssignments;
