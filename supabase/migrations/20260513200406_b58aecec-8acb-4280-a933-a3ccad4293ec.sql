CREATE TABLE public.changelog_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'change',
  status text NOT NULL DEFAULT 'pending',
  position integer NOT NULL DEFAULT 0,
  submitted_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to changelog_entries"
ON public.changelog_entries FOR ALL
USING (true) WITH CHECK (true);

CREATE TRIGGER changelog_entries_set_updated_at
BEFORE UPDATE ON public.changelog_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();