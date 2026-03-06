
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_student(p_exam_id uuid)
RETURNS TABLE(
  id uuid,
  exam_id uuid,
  question_text text,
  question_type text,
  options jsonb,
  points integer,
  order_index integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT eq.id, eq.exam_id, eq.question_text, eq.question_type, eq.options, eq.points, eq.order_index
  FROM public.exam_questions eq
  JOIN public.exams e ON e.id = eq.exam_id
  JOIN public.student_classes sc ON sc.class_id = e.class_id
  WHERE eq.exam_id = p_exam_id
    AND sc.student_id = auth.uid()
    AND e.is_published = true
    AND now() >= e.scheduled_start
    AND now() <= e.scheduled_end;
$$;
