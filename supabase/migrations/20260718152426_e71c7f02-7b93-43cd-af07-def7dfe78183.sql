CREATE POLICY "steps auth select" ON public.steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "steps auth insert" ON public.steps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "steps auth update" ON public.steps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.steps TO authenticated;