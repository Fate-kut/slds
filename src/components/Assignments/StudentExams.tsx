/**
 * Student Exams Component
 * Displays scheduled exams and online exam taking interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useExams } from '@/hooks/useExams';
import { useGrades } from '@/hooks/useGrades';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Clock,
  Calendar,
  Loader2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Timer,
  BookOpen,
  Award,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInSeconds, isFuture, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ExamQuestion } from '@/hooks/useAssignments';

const StudentExams: React.FC = () => {
  const {
    exams,
    examSubmissions,
    isLoading,
    isExamAccessible,
    startExam,
    saveExamAnswers,
    submitExam,
    getExamQuestions,
  } = useExams();
  const { grades } = useGrades();

  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeExam = exams.find(e => e.id === activeExamId);

  const getSubmission = (examId: string) =>
    examSubmissions.find(s => s.exam_id === examId);

  const getGrade = (examId: string) => {
    const submission = getSubmission(examId);
    if (!submission) return null;
    return grades.find(g => g.exam_submission_id === submission.id);
  };

  // Timer countdown
  useEffect(() => {
    if (!activeExam || !activeExamId) return;

    const updateTimer = () => {
      const endTime = new Date(activeExam.scheduled_end);
      const remaining = differenceInSeconds(endTime, new Date());
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0 && activeSubmissionId) {
        // Auto-submit when time runs out
        handleSubmitExam(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeExam, activeExamId, activeSubmissionId]);

  // Auto-save answers
  useEffect(() => {
    if (activeSubmissionId && Object.keys(answers).length > 0) {
      const timer = setTimeout(() => {
        saveExamAnswers(activeSubmissionId, answers);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [answers, activeSubmissionId, saveExamAnswers]);

  const handleStartExam = async (examId: string) => {
    const submission = await startExam(examId);
    if (submission) {
      const examQuestions = await getExamQuestions(examId);
      setQuestions(examQuestions);
      setAnswers((submission.answers as Record<string, string>) || {});
      setActiveExamId(examId);
      setActiveSubmissionId(submission.id);
      setCurrentQuestionIndex(0);
    }
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!activeSubmissionId) return;

    setIsSubmitting(true);
    await submitExam(activeSubmissionId, answers);
    setIsSubmitting(false);
    setShowSubmitConfirm(false);
    setActiveExamId(null);
    setActiveSubmissionId(null);
    setQuestions([]);
    setAnswers({});
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const upcomingExams = exams.filter(e => isFuture(new Date(e.scheduled_start)));
  const activeExams = exams.filter(e => isExamAccessible(e) && !getSubmission(e.id)?.submitted_at);
  const completedExams = exams.filter(e => {
    const submission = getSubmission(e.id);
    return submission?.submitted_at || isPast(new Date(e.scheduled_end));
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Active exam taking interface
  if (activeExamId && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
      <div className="space-y-4">
        {/* Exam Header */}
        <Card className="border-primary">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold">{activeExam?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg',
                  timeRemaining && timeRemaining < 300 ? 'bg-destructive/10 text-destructive' : 'bg-secondary'
                )}>
                  <Timer size={18} />
                  {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                </div>
                <Button variant="destructive" onClick={() => setShowSubmitConfirm(true)}>
                  Submit Exam
                </Button>
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1}
              <Badge variant="secondary" className="ml-2">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base">{currentQuestion.question_text}</p>

            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-secondary">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                placeholder="Enter your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                className="min-h-[150px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(i => i - 1)}
          >
            Previous
          </Button>
          <div className="flex gap-1 flex-wrap justify-center">
            {questions.map((q, i) => (
              <Button
                key={q.id}
                variant={i === currentQuestionIndex ? 'default' : answers[q.id] ? 'secondary' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentQuestionIndex(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex(i => i + 1)}
          >
            Next
          </Button>
        </div>

        {/* Submit Confirmation */}
        <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered {answeredCount} of {questions.length} questions.
                {answeredCount < questions.length && (
                  <span className="text-warning block mt-2">
                    Warning: {questions.length - answeredCount} questions are unanswered.
                  </span>
                )}
                Once submitted, you cannot change your answers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Exam</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleSubmitExam()} disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                Submit Exam
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Exams - Available Now */}
      {activeExams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Available Now
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeExams.map(exam => (
              <Card key={exam.id} className="border-success/50 bg-success/5">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{exam.title}</CardTitle>
                    <Badge className="bg-success">Live</Badge>
                  </div>
                  <CardDescription>
                    {exam.subject?.name} • {exam.class?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{exam.duration_minutes} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ends:</span>
                      <span>{format(new Date(exam.scheduled_end), 'h:mm a')}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleStartExam(exam.id)}>
                    <Play size={16} className="mr-2" />
                    Start Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Exams */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          Upcoming Exams
        </h3>
        {upcomingExams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p>No upcoming exams scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingExams.map(exam => (
              <Card key={exam.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" />
                    {exam.title}
                  </CardTitle>
                  <CardDescription>
                    {exam.subject?.name} • {exam.class?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Date:</span>
                      <span>{format(new Date(exam.scheduled_start), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Time:</span>
                      <span>
                        {format(new Date(exam.scheduled_start), 'h:mm a')} - {format(new Date(exam.scheduled_end), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Duration:</span>
                      <span>{exam.duration_minutes} minutes</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="mt-3">
                    <Clock size={12} className="mr-1" />
                    Starts {formatDistanceToNow(new Date(exam.scheduled_start), { addSuffix: true })}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Exams */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-muted-foreground" />
          Completed Exams
        </h3>
        {completedExams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Award size={40} className="mx-auto mb-3 opacity-40" />
              <p>No completed exams yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completedExams.map(exam => {
              const submission = getSubmission(exam.id);
              const grade = getGrade(exam.id);

              return (
                <Card key={exam.id} className="opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{exam.title}</CardTitle>
                      {submission?.is_auto_submitted && (
                        <Badge variant="outline" className="text-warning border-warning">
                          Auto-submitted
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {exam.subject?.name} • {exam.class?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Completed:</span>
                        <span>
                          {submission?.submitted_at
                            ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
                            : 'Not submitted'}
                        </span>
                      </div>
                      {grade ? (
                        <div className="flex justify-between items-center mt-3 p-2 bg-secondary rounded-md">
                          <span className="font-medium">Grade:</span>
                          <span className="text-lg font-bold text-primary">
                            {grade.score}/{grade.max_score}
                          </span>
                        </div>
                      ) : submission?.submitted_at ? (
                        <div className="mt-3 p-2 bg-muted rounded-md text-center text-muted-foreground">
                          Awaiting grade
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExams;
