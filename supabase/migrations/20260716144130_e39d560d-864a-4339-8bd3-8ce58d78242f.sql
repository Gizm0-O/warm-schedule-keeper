CREATE TABLE public.steps (
  day date PRIMARY KEY,
  count integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.steps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.steps TO authenticated;
GRANT ALL ON public.steps TO service_role;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "steps anon select" ON public.steps FOR SELECT TO anon USING (true);
CREATE POLICY "steps anon insert" ON public.steps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "steps anon update" ON public.steps FOR UPDATE TO anon USING (true) WITH CHECK (true);