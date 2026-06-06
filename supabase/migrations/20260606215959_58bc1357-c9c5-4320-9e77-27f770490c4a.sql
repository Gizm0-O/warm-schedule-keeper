
-- Prevent self-approval: users can only insert their own profile, and only as pending
CREATE POLICY "Users insert own pending profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Explicit admin-only insert on user_roles (defense in depth)
CREATE POLICY "Only admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
