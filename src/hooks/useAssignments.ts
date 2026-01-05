/**
 * Hook for managing assignments and exams data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  class_id: string;
  created_by: string;
  due_date: string;
  allow_late_submission: boolean;
  max_score: number;
  created_at: string;
  updated_at: string;
  subject?: { name: string; code: string } | null;
  class?: { name: string } | null;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  submitted_at: string;
  is_late: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  class_id: string;
  created_by: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  is_online: boolean;
  auto_submit: boolean;
  max_score: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  subject?: { name: string; code: string } | null;
  class?: { name: string } | null;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  order_index: number;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  is_auto_submitted: boolean;
  answers: Record<string, string>;
}

export interface Grade {
  id: string;
  student_id: string;
  graded_by: string;
  assignment_submission_id: string | null;
  exam_submission_id: string | null;
  score: number;
  max_score: number;
  feedback: string | null;
  is_published: boolean;
  graded_at: string;
}

export function useAssignments() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          subject:subjects(name, code),
          class:classes(name)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
    }
  }, [profile]);

  const fetchSubmissions = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', profile.id);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAssignments(), fetchSubmissions()]);
      setIsLoading(false);
    };
    
    if (profile) {
      loadData();
    }
  }, [profile, fetchAssignments, fetchSubmissions]);

  const submitAssignment = async (
    assignmentId: string,
    content: string,
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!profile) return false;

    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return false;

    const isLate = new Date() > new Date(assignment.due_date);
    if (isLate && !assignment.allow_late_submission) {
      toast.error('Late submissions are not allowed for this assignment');
      return false;
    }

    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: profile.id,
          content,
          file_url: fileUrl || null,
          file_name: fileName || null,
          is_late: isLate,
        });

      if (error) throw error;
      
      toast.success('Assignment submitted successfully');
      await fetchSubmissions();
      return true;
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
      return false;
    }
  };

  const createAssignment = async (data: {
    title: string;
    description?: string;
    subject_id?: string;
    class_id: string;
    due_date: string;
    allow_late_submission?: boolean;
    max_score?: number;
  }) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          created_by: profile.id,
        });

      if (error) throw error;
      
      toast.success('Assignment created successfully');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
      return false;
    }
  };

  const updateAssignment = async (id: string, data: Partial<Assignment>) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Assignment updated successfully');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
      return false;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Assignment deleted successfully');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
      return false;
    }
  };

  return {
    assignments,
    submissions,
    isLoading,
    submitAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    refreshAssignments: fetchAssignments,
  };
}
