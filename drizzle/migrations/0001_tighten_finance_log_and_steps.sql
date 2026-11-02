DROP POLICY IF EXISTS "auth read finance log" ON public.finance_entries_deleted_log;
DROP POLICY IF EXISTS "trigger inserts allowed" ON public.finance_entries_deleted_log;
CREATE POLICY "approved read finance log" ON public.finance_entries_deleted_log
  FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "steps auth select" ON public.steps;
DROP POLICY IF EXISTS "steps auth insert" ON public.steps;
DROP POLICY IF EXISTS "steps auth update" ON public.steps;
CREATE POLICY "steps approved select" ON public.steps FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "steps admin insert" ON public.steps FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "steps admin update" ON public.steps FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));