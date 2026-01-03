-- Allow students to update their own assigned locker status
CREATE POLICY "Students update own locker" 
ON public.lockers 
FOR UPDATE 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);