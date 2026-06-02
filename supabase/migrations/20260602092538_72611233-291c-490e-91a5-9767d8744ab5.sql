ALTER TABLE public.hourly_tasks
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS unit_amount integer NOT NULL DEFAULT 0;

UPDATE public.hourly_tasks
SET rate_per_hour = 250, milestone_hours = 5, milestone_bonus_percent = 0.25, xp_per_hour = 5, kind = 'hourly', unit_amount = 0
WHERE name = 'Vyhraj' AND month = to_char(now(), 'YYYY-MM');

UPDATE public.hourly_tasks
SET rate_per_hour = 0, milestone_hours = 1, milestone_bonus_percent = 0.1, xp_per_hour = 10, kind = 'progressive', unit_amount = 500, hours_worked = 0
WHERE name = 'Tetování' AND month = to_char(now(), 'YYYY-MM');