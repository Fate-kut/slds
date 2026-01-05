/**
 * Teacher Exams Management Component
 * Create, schedule, and manage exams with questions
 */

import React, { useState, useEffect } from 'react';
import { useExams } from '@/hooks/useExams';
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
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  Award,
  Send,
  Play,
  Eye,
  Calendar,
} from 'lucide-react';
import { format, isFuture, isPast } from 'date-fns';
import { toast } from 'sonner';
import type { Exam, ExamQuestion } from '@/hooks/useAssignments';

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

const TeacherExams: React.FC = () => {
  const {
    exams,
    isLoading,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    getExamQuestions,
    addExamQuestion,
    updateExamQuestion,
    deleteExamQuestion,
  } = useExams();
  const { getExamSubmissions, gradeSubmission, updateGrade, publishGrades } = useGrades();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [managingExam, setManagingExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [gradingExam, setGradingExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    class_id: '',
    scheduled_start: '',
    scheduled_end: '',
    duration_minutes: 60,
    is_online: true,
    auto_submit: true,
    max_score: 100,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
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
      scheduled_start: '',
      scheduled_end: '',
      duration_minutes: 60,
      is_online: true,
      auto_submit: true,
      max_score: 100,
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.class_id || !formData.scheduled_start || !formData.scheduled_end) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    const exam = await createExam({
      title: formData.title,
      description: formData.description || undefined,
      subject_id: formData.subject_id || undefined,
      class_id: formData.class_id,
      scheduled_start: new Date(formData.scheduled_start).toISOString(),
      scheduled_end: new Date(formData.scheduled_end).toISOString(),
      duration_minutes: formData.duration_minutes,
      is_online: formData.is_online,
      auto_submit: formData.auto_submit,
      max_score: formData.max_score,
    });
    setIsSubmitting(false);

    if (exam) {
      setIsCreateOpen(false);
      resetForm();
      // Open question management for the new exam
      setManagingExam(exam);
      setQuestions([]);
    }
  };

  const handleUpdate = async () => {
    if (!editingExam) return;

    setIsSubmitting(true);
    const success = await updateExam(editingExam.id, {
      title: formData.title,
      description: formData.description || null,
      scheduled_start: new Date(formData.scheduled_start).toISOString(),
      scheduled_end: new Date(formData.scheduled_end).toISOString(),
      duration_minutes: formData.duration_minutes,
      auto_submit: formData.auto_submit,
      max_score: formData.max_score,
    });
    setIsSubmitting(false);

    if (success) {
      setEditingExam(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteExam(deleteConfirm);
    setDeleteConfirm(null);
  };

  const handlePublish = async (exam: Exam) => {
    await publishExam(exam.id, !exam.is_published);
  };

  const openQuestions = async (exam: Exam) => {
    setManagingExam(exam);
    const qs = await getExamQuestions(exam.id);
    setQuestions(qs);
  };

  const handleAddQuestion = async () => {
    if (!managingExam || !questionForm.question_text) return;

    const filteredOptions = questionForm.options.filter(o => o.trim());
    
    const success = await addExamQuestion({
      exam_id: managingExam.id,
      question_text: questionForm.question_text,
      question_type: questionForm.question_type,
      options: questionForm.question_type === 'multiple_choice' ? filteredOptions : undefined,
      correct_answer: questionForm.correct_answer || undefined,
      points: questionForm.points,
      order_index: questions.length,
    });

    if (success) {
      const qs = await getExamQuestions(managingExam.id);
      setQuestions(qs);
      resetQuestionForm();
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!managingExam) return;
    
    await deleteExamQuestion(questionId);
    const qs = await getExamQuestions(managingExam.id);
    setQuestions(qs);
  };

  const openGrading = async (exam: Exam) => {
    setGradingExam(exam);
    const subs = await getExamSubmissions(exam.id);
    setSubmissions(subs);
    
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
    if (!gradingExam || data.score === undefined) return;

    if (submission.grade) {
      await updateGrade(submission.grade.id, {
        score: data.score,
        feedback: data.feedback,
      });
    } else {
      await gradeSubmission({
        student_id: submission.student_id,
        exam_submission_id: submission.id,
        score: data.score,
        max_score: gradingExam.max_score,
        feedback: data.feedback,
      });
    }

    const subs = await getExamSubmissions(gradingExam.id);
    setSubmissions(subs);
  };

  const handlePublishGrades = async () => {
    const gradeIds = submissions
      .filter(s => s.grade && !s.grade.is_published)
      .map(s => s.grade.id);
    
    if (gradeIds.length > 0) {
      await publishGrades(gradeIds);
      if (gradingExam) {
        const subs = await getExamSubmissions(gradingExam.id);
        setSubmissions(subs);
      }
    }
  };

  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.scheduled_start);
    const end = new Date(exam.scheduled_end);

    if (!exam.is_published) return { label: 'Draft', variant: 'secondary' as const };
    if (now < start) return { label: 'Scheduled', variant: 'outline' as const };
    if (now >= start && now <= end) return { label: 'In Progress', variant: 'default' as const };
    return { label: 'Completed', variant: 'secondary' as const };
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
          <BookOpen size={20} className="text-primary" />
          Exams
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus size={16} className="mr-2" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Exam</DialogTitle>
              <DialogDescription>Schedule a new exam for students</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Exam title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Exam instructions..."
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
                  <Label htmlFor="scheduled_start">Start Time *</Label>
                  <Input
                    id="scheduled_start"
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_end">End Time *</Label>
                  <Input
                    id="scheduled_end"
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="online"
                    checked={formData.is_online}
                    onCheckedChange={(c) => setFormData({ ...formData, is_online: c })}
                  />
                  <Label htmlFor="online">Online Exam</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto_submit"
                    checked={formData.auto_submit}
                    onCheckedChange={(c) => setFormData({ ...formData, auto_submit: c })}
                  />
                  <Label htmlFor="auto_submit">Auto-submit on time end</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                Create & Add Questions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No exams yet</p>
            <p className="text-sm">Create your first exam to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map(exam => {
            const status = getExamStatus(exam);

            return (
              <Card key={exam.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{exam.title}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <CardDescription>
                    {exam.subject?.name || 'No subject'} • {exam.class?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {format(new Date(exam.scheduled_start), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {format(new Date(exam.scheduled_start), 'h:mm a')} - {format(new Date(exam.scheduled_end), 'h:mm a')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Award size={14} />
                      {exam.duration_minutes} min • Max: {exam.max_score}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openQuestions(exam)}
                    >
                      <Eye size={14} className="mr-1" />
                      Questions
                    </Button>
                    <Button
                      size="sm"
                      variant={exam.is_published ? 'secondary' : 'default'}
                      onClick={() => handlePublish(exam)}
                    >
                      {exam.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    {isPast(new Date(exam.scheduled_end)) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openGrading(exam)}
                      >
                        <Users size={14} className="mr-1" />
                        Grade
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingExam(exam);
                        setFormData({
                          title: exam.title,
                          description: exam.description || '',
                          subject_id: exam.subject_id || '',
                          class_id: exam.class_id,
                          scheduled_start: format(new Date(exam.scheduled_start), "yyyy-MM-dd'T'HH:mm"),
                          scheduled_end: format(new Date(exam.scheduled_end), "yyyy-MM-dd'T'HH:mm"),
                          duration_minutes: exam.duration_minutes,
                          is_online: exam.is_online,
                          auto_submit: exam.auto_submit,
                          max_score: exam.max_score,
                        });
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteConfirm(exam.id)}
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

      {/* Edit Exam Dialog */}
      <Dialog open={!!editingExam} onOpenChange={() => setEditingExam(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExam(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Management Dialog */}
      <Dialog open={!!managingExam} onOpenChange={() => setManagingExam(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Manage Questions: {managingExam?.title}</DialogTitle>
            <DialogDescription>
              Add and manage exam questions ({questions.length} questions)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {/* Existing Questions */}
              {questions.map((q, index) => (
                <Card key={q.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">Q{index + 1}: {q.question_text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.question_type} • {q.points} points
                        </p>
                        {q.options && (
                          <div className="mt-2 text-sm">
                            {q.options.map((opt, i) => (
                              <p key={i} className={opt === q.correct_answer ? 'text-success' : ''}>
                                {String.fromCharCode(65 + i)}. {opt}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Question Form */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Add New Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={questionForm.question_text}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                      placeholder="Enter question..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={questionForm.question_type}
                        onValueChange={(v) => setQuestionForm({ ...questionForm, question_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        value={questionForm.points}
                        onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  {questionForm.question_type === 'multiple_choice' && (
                    <>
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {questionForm.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="w-6 text-sm text-muted-foreground pt-2">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...questionForm.options];
                                newOptions[i] = e.target.value;
                                setQuestionForm({ ...questionForm, options: newOptions });
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select
                          value={questionForm.correct_answer}
                          onValueChange={(v) => setQuestionForm({ ...questionForm, correct_answer: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct option" />
                          </SelectTrigger>
                          <SelectContent>
                            {questionForm.options.filter(o => o.trim()).map((opt, i) => (
                              <SelectItem key={i} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <Button onClick={handleAddQuestion} disabled={!questionForm.question_text}>
                    <Plus size={14} className="mr-2" />
                    Add Question
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setManagingExam(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={!!gradingExam} onOpenChange={() => setGradingExam(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Grade Exam: {gradingExam?.title}</DialogTitle>
            <DialogDescription>
              Review and grade student exam submissions
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
                          {sub.is_auto_submitted && (
                            <Badge variant="outline" className="text-warning border-warning">Auto</Badge>
                          )}
                          {sub.grade?.is_published && (
                            <Badge className="bg-success">Published</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        Submitted: {sub.submitted_at ? format(new Date(sub.submitted_at), 'MMM d, yyyy h:mm a') : 'Not submitted'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Score (max {gradingExam?.max_score})</Label>
                          <Input
                            type="number"
                            min={0}
                            max={gradingExam?.max_score}
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
            <Button variant="outline" onClick={() => setGradingExam(null)}>Close</Button>
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
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam, all questions, and submissions. This action cannot be undone.
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

export default TeacherExams;
