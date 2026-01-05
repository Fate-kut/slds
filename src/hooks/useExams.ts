/**
 * Hook for managing exams data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Exam, ExamQuestion, ExamSubmission } from './useAssignments';

export function useExams() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubmissions, setExamSubmissions] = useState<ExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const autoSubmitTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchExams = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          subject:subjects(name, code),
          class:classes(name)
        `)
        .order('scheduled_start', { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
    }
  }, [profile]);

  const fetchExamSubmissions = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select('*')
        .eq('student_id', profile.id);

      if (error) throw error;
      setExamSubmissions((data || []).map(s => ({
        ...s,
        answers: (s.answers as Record<string, string>) || {},
      })));
    } catch (error: any) {
      console.error('Error fetching exam submissions:', error);
    }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchExams(), fetchExamSubmissions()]);
      setIsLoading(false);
    };
    
    if (profile) {
      loadData();
    }

    return () => {
      // Clear all auto-submit timers on unmount
      autoSubmitTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [profile, fetchExams, fetchExamSubmissions]);

  const isExamAccessible = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.scheduled_start);
    const end = new Date(exam.scheduled_end);
    return now >= start && now <= end && exam.is_published;
  };

  const startExam = async (examId: string) => {
    if (!profile) return null;

    const exam = exams.find(e => e.id === examId);
    if (!exam || !isExamAccessible(exam)) {
      toast.error('This exam is not currently accessible');
      return null;
    }

    // Check if already started
    const existingSubmission = examSubmissions.find(s => s.exam_id === examId);
    if (existingSubmission) {
      return existingSubmission;
    }

    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .insert({
          exam_id: examId,
          student_id: profile.id,
          answers: {},
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchExamSubmissions();
      
      // Setup auto-submit timer
      if (exam.auto_submit) {
        const endTime = new Date(exam.scheduled_end).getTime();
        const timeUntilEnd = endTime - Date.now();
        
        if (timeUntilEnd > 0) {
          const timer = setTimeout(() => {
            autoSubmitExam(examId, data.id);
          }, timeUntilEnd);
          autoSubmitTimers.current.set(examId, timer);
        }
      }
      
      return data;
    } catch (error: any) {
      console.error('Error starting exam:', error);
      toast.error('Failed to start exam');
      return null;
    }
  };

  const saveExamAnswers = async (submissionId: string, answers: Record<string, string>) => {
    try {
      const { error } = await supabase
        .from('exam_submissions')
        .update({ answers })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error saving answers:', error);
      return false;
    }
  };

  const submitExam = async (submissionId: string, answers: Record<string, string>) => {
    try {
      const { error } = await supabase
        .from('exam_submissions')
        .update({
          answers,
          submitted_at: new Date().toISOString(),
          is_auto_submitted: false,
        })
        .eq('id', submissionId);

      if (error) throw error;
      
      toast.success('Exam submitted successfully');
      await fetchExamSubmissions();
      return true;
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
      return false;
    }
  };

  const autoSubmitExam = async (examId: string, submissionId: string) => {
    try {
      const { error } = await supabase
        .from('exam_submissions')
        .update({
          submitted_at: new Date().toISOString(),
          is_auto_submitted: true,
        })
        .eq('id', submissionId);

      if (error) throw error;
      
      toast.warning('Exam auto-submitted due to time limit');
      await fetchExamSubmissions();
    } catch (error: any) {
      console.error('Error auto-submitting exam:', error);
    }
  };

  const getExamQuestions = async (examId: string): Promise<ExamQuestion[]> => {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(q => ({
        ...q,
        options: q.options as string[] | null,
      }));
    } catch (error: any) {
      console.error('Error fetching exam questions:', error);
      return [];
    }
  };

  // Teacher functions
  const createExam = async (data: {
    title: string;
    description?: string;
    subject_id?: string;
    class_id: string;
    scheduled_start: string;
    scheduled_end: string;
    duration_minutes?: number;
    is_online?: boolean;
    auto_submit?: boolean;
    max_score?: number;
  }) => {
    if (!profile) return null;

    try {
      const { data: examData, error } = await supabase
        .from('exams')
        .insert({
          ...data,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Exam created successfully');
      await fetchExams();
      return examData;
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam');
      return null;
    }
  };

  const updateExam = async (id: string, data: Partial<Exam>) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Exam updated successfully');
      await fetchExams();
      return true;
    } catch (error: any) {
      console.error('Error updating exam:', error);
      toast.error('Failed to update exam');
      return false;
    }
  };

  const deleteExam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Exam deleted successfully');
      await fetchExams();
      return true;
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
      return false;
    }
  };

  const publishExam = async (id: string, publish: boolean) => {
    return updateExam(id, { is_published: publish });
  };

  const addExamQuestion = async (data: {
    exam_id: string;
    question_text: string;
    question_type?: string;
    options?: string[];
    correct_answer?: string;
    points?: number;
    order_index?: number;
  }) => {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .insert(data);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
      return false;
    }
  };

  const updateExamQuestion = async (id: string, data: Partial<ExamQuestion>) => {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error updating question:', error);
      return false;
    }
  };

  const deleteExamQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting question:', error);
      return false;
    }
  };

  return {
    exams,
    examSubmissions,
    isLoading,
    isExamAccessible,
    startExam,
    saveExamAnswers,
    submitExam,
    getExamQuestions,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    addExamQuestion,
    updateExamQuestion,
    deleteExamQuestion,
    refreshExams: fetchExams,
  };
}
