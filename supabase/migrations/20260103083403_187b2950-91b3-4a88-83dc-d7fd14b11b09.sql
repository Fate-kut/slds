-- Create RLS policies for admin access to lockers
CREATE POLICY "Admins view all lockers" 
ON public.lockers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update lockers" 
ON public.lockers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert lockers" 
ON public.lockers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete lockers" 
ON public.lockers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin access to activity logs
CREATE POLICY "Admins view all logs" 
ON public.activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin access to profiles (for user monitoring)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin access to user_roles (for role management)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin access to system settings
CREATE POLICY "Admins modify settings" 
ON public.system_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));