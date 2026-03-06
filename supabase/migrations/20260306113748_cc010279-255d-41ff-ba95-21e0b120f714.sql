
-- Fix system_settings: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can read settings" ON public.system_settings;
CREATE POLICY "Authenticated users can read settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (true);

-- Fix exam_questions: remove student direct access to correct_answer
DROP POLICY IF EXISTS "Students view exam questions during exam" ON public.exam_questions;
