/**
 * Student Assignments Component
 * Displays assignments, deadlines, and submission interface for students
 */

import React, { useState } from 'react';
import { useAssignments } from '@/hooks/useAssignments';
import { useGrades } from '@/hooks/useGrades';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Loader2,
  BookOpen,
  Award,
} from 'lucide-react';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const StudentAssignments: React.FC = () => {
  const { assignments, submissions, isLoading, submitAssignment } = useAssignments();
  const { grades } = useGrades();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSubmission = (assignmentId: string) =>
    submissions.find(s => s.assignment_id === assignmentId);

  const getGrade = (assignmentId: string) => {
    const submission = getSubmission(assignmentId);
    if (!submission) return null;
    return grades.find(g => g.assignment_submission_id === submission.id);
  };

  const pendingAssignments = assignments.filter(a => !getSubmission(a.id));
  const submittedAssignments = assignments.filter(a => getSubmission(a.id));

  const handleSubmit = async () => {
    if (!selectedAssignment || !submissionContent.trim()) return;

    setIsSubmitting(true);
    const success = await submitAssignment(selectedAssignment, submissionContent);
    setIsSubmitting(false);

    if (success) {
      setSelectedAssignment(null);
      setSubmissionContent('');
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
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock size={16} />
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            <CheckCircle2 size={16} />
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <Award size={16} />
            Grades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No pending assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingAssignments.map(assignment => {
                const isPastDue = isPast(new Date(assignment.due_date));
                const canSubmit = !isPastDue || assignment.allow_late_submission;

                return (
                  <Card key={assignment.id} className={cn(
                    'transition-all hover:shadow-md',
                    isPastDue && !assignment.allow_late_submission && 'opacity-60'
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText size={16} className="text-primary flex-shrink-0" />
                            {assignment.title}
                          </CardTitle>
                          {assignment.subject && (
                            <CardDescription className="mt-1">
                              {assignment.subject.name} • {assignment.class?.name}
                            </CardDescription>
                          )}
                        </div>
                        {isPastDue ? (
                          <Badge variant="destructive" className="flex-shrink-0">
                            <AlertTriangle size={12} className="mr-1" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Clock size={12} className="mr-1" />
                            {formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
                        </div>
                        <Button
                          size="sm"
                          disabled={!canSubmit}
                          onClick={() => setSelectedAssignment(assignment.id)}
                        >
                          <Send size={14} className="mr-1" />
                          Submit
                        </Button>
                      </div>
                      {isPastDue && assignment.allow_late_submission && (
                        <p className="text-xs text-warning mt-2">
                          Late submissions allowed
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted">
          {submittedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No submissions yet</p>
                <p className="text-sm">Submit your first assignment to see it here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {submittedAssignments.map(assignment => {
                const submission = getSubmission(assignment.id);
                const grade = getGrade(assignment.id);

                return (
                  <Card key={assignment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                            {assignment.title}
                          </CardTitle>
                          {assignment.subject && (
                            <CardDescription className="mt-1">
                              {assignment.subject.name} • {assignment.class?.name}
                            </CardDescription>
                          )}
                        </div>
                        {submission?.is_late && (
                          <Badge variant="outline" className="text-warning border-warning">
                            Late
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Submitted:</span>
                          <span>{submission && format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        {grade ? (
                          <div className="flex justify-between items-center mt-3 p-2 bg-secondary rounded-md">
                            <span className="font-medium">Grade:</span>
                            <span className="text-lg font-bold text-primary">
                              {grade.score}/{grade.max_score}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-3 p-2 bg-muted rounded-md text-center text-muted-foreground">
                            Awaiting grade
                          </div>
                        )}
                        {grade?.feedback && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Feedback:</p>
                            <p className="text-sm">{grade.feedback}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award size={18} className="text-primary" />
                My Grades
              </CardTitle>
              <CardDescription>View all your graded assignments and exams</CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Award size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No grades yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {grades.map(grade => (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {grade.assignment?.title || grade.exam?.title || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Graded on {format(new Date(grade.graded_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {grade.score}/{grade.max_score}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((grade.score / grade.max_score) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Assignment Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {assignments.find(a => a.id === selectedAssignment)?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter your answer or paste your work here..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!submissionContent.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Submit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAssignments;
