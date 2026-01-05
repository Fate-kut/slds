/**
 * Hook for managing grades data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Grade, AssignmentSubmission, ExamSubmission } from './useAssignments';

export interface GradeWithDetails extends Grade {
  assignment?: {
    title: string;
    max_score: number;
  } | null;
  exam?: {
    title: string;
    max_score: number;
  } | null;
  student?: {
    name: string;
    username: string;
  } | null;
}

export function useGrades() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    if (!profile) return;
    
    try {
      // First get basic grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('graded_at', { ascending: false });

      if (gradesError) throw gradesError;

      // Enrich with assignment/exam details
      const enrichedGrades: GradeWithDetails[] = [];
      
      for (const grade of gradesData || []) {
        let enriched: GradeWithDetails = { ...grade };

        if (grade.assignment_submission_id) {
          const { data: submission } = await supabase
            .from('assignment_submissions')
            .select('assignment_id')
            .eq('id', grade.assignment_submission_id)
            .maybeSingle();

          if (submission) {
            const { data: assignment } = await supabase
              .from('assignments')
              .select('title, max_score')
              .eq('id', submission.assignment_id)
              .maybeSingle();
            
            enriched.assignment = assignment;
          }
        }

        if (grade.exam_submission_id) {
          const { data: submission } = await supabase
            .from('exam_submissions')
            .select('exam_id')
            .eq('id', grade.exam_submission_id)
            .maybeSingle();

          if (submission) {
            const { data: exam } = await supabase
              .from('exams')
              .select('title, max_score')
              .eq('id', submission.exam_id)
              .maybeSingle();
            
            enriched.exam = exam;
          }
        }

        // Get student info for teachers
        const { data: student } = await supabase
          .from('profiles')
          .select('name, username')
          .eq('id', grade.student_id)
          .maybeSingle();
        
        enriched.student = student;

        enrichedGrades.push(enriched);
      }
      
      setGrades(enrichedGrades);
    } catch (error: any) {
      console.error('Error fetching grades:', error);
    }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchGrades();
      setIsLoading(false);
    };
    
    if (profile) {
      loadData();
    }
  }, [profile, fetchGrades]);

  const gradeSubmission = async (data: {
    student_id: string;
    assignment_submission_id?: string;
    exam_submission_id?: string;
    score: number;
    max_score: number;
    feedback?: string;
    is_published?: boolean;
  }) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('grades')
        .insert({
          ...data,
          graded_by: profile.id,
        });

      if (error) throw error;
      
      toast.success('Grade saved successfully');
      await fetchGrades();
      return true;
    } catch (error: any) {
      console.error('Error grading submission:', error);
      toast.error('Failed to save grade');
      return false;
    }
  };

  const updateGrade = async (id: string, data: {
    score?: number;
    feedback?: string;
    is_published?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('grades')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Grade updated successfully');
      await fetchGrades();
      return true;
    } catch (error: any) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update grade');
      return false;
    }
  };

  const publishGrades = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('grades')
        .update({ is_published: true })
        .in('id', ids);

      if (error) throw error;
      
      toast.success('Grades published successfully');
      await fetchGrades();
      return true;
    } catch (error: any) {
      console.error('Error publishing grades:', error);
      toast.error('Failed to publish grades');
      return false;
    }
  };

  // Get all submissions for grading (teachers)
  const getAssignmentSubmissions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId);

      if (error) throw error;
      
      // Enrich with student names and existing grades
      const enriched = [];
      for (const submission of data || []) {
        const { data: student } = await supabase
          .from('profiles')
          .select('name, username')
          .eq('id', submission.student_id)
          .maybeSingle();

        const { data: existingGrade } = await supabase
          .from('grades')
          .select('*')
          .eq('assignment_submission_id', submission.id)
          .maybeSingle();

        enriched.push({
          ...submission,
          student,
          grade: existingGrade,
        });
      }
      
      return enriched;
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  };

  const getExamSubmissions = async (examId: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select('*')
        .eq('exam_id', examId)
        .not('submitted_at', 'is', null);

      if (error) throw error;
      
      // Enrich with student names and existing grades
      const enriched = [];
      for (const submission of data || []) {
        const { data: student } = await supabase
          .from('profiles')
          .select('name, username')
          .eq('id', submission.student_id)
          .maybeSingle();

        const { data: existingGrade } = await supabase
          .from('grades')
          .select('*')
          .eq('exam_submission_id', submission.id)
          .maybeSingle();

        enriched.push({
          ...submission,
          student,
          grade: existingGrade,
        });
      }
      
      return enriched;
    } catch (error: any) {
      console.error('Error fetching exam submissions:', error);
      return [];
    }
  };

  return {
    grades,
    isLoading,
    gradeSubmission,
    updateGrade,
    publishGrades,
    getAssignmentSubmissions,
    getExamSubmissions,
    refreshGrades: fetchGrades,
  };
}
