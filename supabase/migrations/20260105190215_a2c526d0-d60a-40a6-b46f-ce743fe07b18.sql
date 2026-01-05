-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  created_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  allow_late_submission BOOLEAN NOT NULL DEFAULT false,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  created_by UUID NOT NULL,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_online BOOLEAN NOT NULL DEFAULT true,
  auto_submit BOOLEAN NOT NULL DEFAULT true,
  max_score INTEGER NOT NULL DEFAULT 100,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam questions table
CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_late BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(assignment_id, student_id)
);

-- Create exam submissions table
CREATE TABLE public.exam_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  is_auto_submitted BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}',
  UNIQUE(exam_id, student_id)
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  graded_by UUID NOT NULL,
  assignment_submission_id UUID REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  exam_submission_id UUID REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  feedback TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  graded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT grade_has_submission CHECK (
    (assignment_submission_id IS NOT NULL AND exam_submission_id IS NULL) OR
    (assignment_submission_id IS NULL AND exam_submission_id IS NOT NULL)
  )
);

-- Enable RLS on all tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Assignments RLS policies
CREATE POLICY "Students view assigned class assignments"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_classes sc
    WHERE sc.class_id = assignments.class_id AND sc.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers view all assignments"
ON public.assignments FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all assignments"
ON public.assignments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage assignments"
ON public.assignments FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage assignments"
ON public.assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Exams RLS policies
CREATE POLICY "Students view assigned class exams"
ON public.exams FOR SELECT
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM public.student_classes sc
    WHERE sc.class_id = exams.class_id AND sc.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers view all exams"
ON public.exams FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all exams"
ON public.exams FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Exam questions RLS policies
CREATE POLICY "Students view exam questions during exam"
ON public.exam_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.student_classes sc ON sc.class_id = e.class_id
    WHERE e.id = exam_questions.exam_id 
      AND sc.student_id = auth.uid()
      AND e.is_published = true
      AND now() >= e.scheduled_start
      AND now() <= e.scheduled_end
  )
);

CREATE POLICY "Teachers view all exam questions"
ON public.exam_questions FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all exam questions"
ON public.exam_questions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage exam questions"
ON public.exam_questions FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage exam questions"
ON public.exam_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Assignment submissions RLS policies
CREATE POLICY "Students view own submissions"
ON public.assignment_submissions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students submit assignments"
ON public.assignment_submissions FOR INSERT
WITH CHECK (
  auth.uid() = student_id AND
  NOT EXISTS (
    SELECT 1 FROM public.assignment_submissions 
    WHERE assignment_id = assignment_submissions.assignment_id AND student_id = auth.uid()
  )
);

CREATE POLICY "Teachers view all submissions"
ON public.assignment_submissions FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all submissions"
ON public.assignment_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Exam submissions RLS policies
CREATE POLICY "Students view own exam submissions"
ON public.exam_submissions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students start exams"
ON public.exam_submissions FOR INSERT
WITH CHECK (
  auth.uid() = student_id AND
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_submissions.exam_id
      AND e.is_published = true
      AND now() >= e.scheduled_start
      AND now() <= e.scheduled_end
  )
);

CREATE POLICY "Students update own exam submissions"
ON public.exam_submissions FOR UPDATE
USING (
  auth.uid() = student_id AND
  submitted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_submissions.exam_id
      AND now() <= e.scheduled_end
  )
);

CREATE POLICY "Teachers view all exam submissions"
ON public.exam_submissions FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all exam submissions"
ON public.exam_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers update exam submissions"
ON public.exam_submissions FOR UPDATE
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Grades RLS policies
CREATE POLICY "Students view own published grades"
ON public.grades FOR SELECT
USING (auth.uid() = student_id AND is_published = true);

CREATE POLICY "Teachers view all grades"
ON public.grades FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all grades"
ON public.grades FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage grades"
ON public.grades FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage grades"
ON public.grades FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();