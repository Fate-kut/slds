-- Fix missing INSERT/UPDATE/DELETE policies on user_roles table
-- Deny all direct modifications (roles are managed by triggers only)

CREATE POLICY "No direct role insertion"
ON public.user_roles FOR INSERT
WITH CHECK (false);

CREATE POLICY "No role updates"
ON public.user_roles FOR UPDATE
USING (false);

CREATE POLICY "No role deletion"
ON public.user_roles FOR DELETE
USING (false);

-- Create lockers table for persistent locker management
CREATE TABLE public.lockers (
  id TEXT PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL DEFAULT 'Unassigned',
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked')),
  location TEXT NOT NULL,
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lockers ENABLE ROW LEVEL SECURITY;

-- Students can view their own locker
CREATE POLICY "Students view own locker"
ON public.lockers FOR SELECT
USING (auth.uid() = student_id);

-- Teachers can view all lockers
CREATE POLICY "Teachers view all lockers"
ON public.lockers FOR SELECT
USING (has_role(auth.uid(), 'teacher'));

-- Only teachers can insert lockers
CREATE POLICY "Teachers insert lockers"
ON public.lockers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher'));

-- Only teachers can update lockers (lock/unlock, assign students)
CREATE POLICY "Teachers update lockers"
ON public.lockers FOR UPDATE
USING (has_role(auth.uid(), 'teacher'))
WITH CHECK (has_role(auth.uid(), 'teacher'));

-- Only teachers can delete lockers
CREATE POLICY "Teachers delete lockers"
ON public.lockers FOR DELETE
USING (has_role(auth.uid(), 'teacher'));

-- Create system_settings table for exam mode and other settings
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings"
ON public.system_settings FOR SELECT
USING (true);

-- Only teachers can insert settings
CREATE POLICY "Teachers insert settings"
ON public.system_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher'));

-- Only teachers can modify settings
CREATE POLICY "Teachers modify settings"
ON public.system_settings FOR UPDATE
USING (has_role(auth.uid(), 'teacher'))
WITH CHECK (has_role(auth.uid(), 'teacher'));

-- Create activity_logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('student', 'teacher')),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Students can view their own logs
CREATE POLICY "Users view own logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- Teachers can view all logs
CREATE POLICY "Teachers view all logs"
ON public.activity_logs FOR SELECT
USING (has_role(auth.uid(), 'teacher'));

-- Users can insert their own logs
CREATE POLICY "Users insert own logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default exam_mode setting
INSERT INTO public.system_settings (key, value) 
VALUES ('exam_mode', '{"enabled": false}'::jsonb);

-- Create trigger for updated_at on lockers
CREATE TRIGGER update_lockers_updated_at
BEFORE UPDATE ON public.lockers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for lockers and system_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.lockers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;