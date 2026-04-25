-- Tabulka pro hodinové úkoly (speciální typ úkolu bez deadlinu)
CREATE TABLE public.hourly_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_hour INTEGER NOT NULL DEFAULT 250,
  milestone_hours INTEGER NOT NULL DEFAULT 5,
  milestone_bonus_percent NUMERIC NOT NULL DEFAULT 0.5,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  month TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  color TEXT NOT NULL DEFAULT 'hsl(var(--primary))',
  person TEXT NOT NULL DEFAULT 'Tadeáš',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hourly_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to hourly_tasks"
  ON public.hourly_tasks FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_hourly_tasks_updated_at
  BEFORE UPDATE ON public.hourly_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();