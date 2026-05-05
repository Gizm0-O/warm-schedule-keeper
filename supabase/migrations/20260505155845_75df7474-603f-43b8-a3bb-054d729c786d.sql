
-- XP overrides per todo (admin-set)
CREATE TABLE public.task_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id TEXT NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to task_xp"
ON public.task_xp FOR ALL
USING (true) WITH CHECK (true);

CREATE TRIGGER task_xp_updated_at
BEFORE UPDATE ON public.task_xp
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- XP per hour for hourly tasks (default 10)
ALTER TABLE public.hourly_tasks
ADD COLUMN xp_per_hour INTEGER NOT NULL DEFAULT 10;

-- Total XP snapshot in monthly archive
ALTER TABLE public.monthly_archives
ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
