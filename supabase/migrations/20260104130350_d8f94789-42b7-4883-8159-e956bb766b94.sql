-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_classes junction table
CREATE TABLE public.student_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Create learning_materials table
CREATE TABLE public.learning_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_assignments table
CREATE TABLE public.material_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.learning_materials(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(material_id, class_id)
);

-- Enable RLS on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_assignments ENABLE ROW LEVEL SECURITY;

-- Subjects policies (readable by all authenticated, manageable by teachers/admins)
CREATE POLICY "Anyone can view subjects"
ON public.subjects FOR SELECT
USING (true);

CREATE POLICY "Teachers can manage subjects"
ON public.subjects FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Classes policies
CREATE POLICY "Anyone can view classes"
ON public.classes FOR SELECT
USING (true);

CREATE POLICY "Teachers can manage classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can manage classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Student_classes policies
CREATE POLICY "Students view own class assignments"
ON public.student_classes FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers view all class assignments"
ON public.student_classes FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all class assignments"
ON public.student_classes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage class assignments"
ON public.student_classes FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage class assignments"
ON public.student_classes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Learning_materials policies
CREATE POLICY "Students view assigned materials"
ON public.learning_materials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.material_assignments ma
    JOIN public.student_classes sc ON ma.class_id = sc.class_id
    WHERE ma.material_id = learning_materials.id
    AND sc.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers view all materials"
ON public.learning_materials FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all materials"
ON public.learning_materials FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage materials"
ON public.learning_materials FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage materials"
ON public.learning_materials FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Material_assignments policies
CREATE POLICY "Students view own material assignments"
ON public.material_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_classes sc
    WHERE sc.class_id = material_assignments.class_id
    AND sc.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers view all assignments"
ON public.material_assignments FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins view all assignments"
ON public.material_assignments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage assignments"
ON public.material_assignments FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins manage assignments"
ON public.material_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on learning_materials
CREATE TRIGGER update_learning_materials_updated_at
BEFORE UPDATE ON public.learning_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for learning materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('learning-materials', 'learning-materials', true);

-- Storage policies for learning-materials bucket
CREATE POLICY "Anyone can view learning materials files"
ON storage.objects FOR SELECT
USING (bucket_id = 'learning-materials');

CREATE POLICY "Teachers can upload learning materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'learning-materials' AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can upload learning materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'learning-materials' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can update learning materials files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'learning-materials' AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can update learning materials files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'learning-materials' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can delete learning materials files"
ON storage.objects FOR DELETE
USING (bucket_id = 'learning-materials' AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can delete learning materials files"
ON storage.objects FOR DELETE
USING (bucket_id = 'learning-materials' AND has_role(auth.uid(), 'admin'::app_role));