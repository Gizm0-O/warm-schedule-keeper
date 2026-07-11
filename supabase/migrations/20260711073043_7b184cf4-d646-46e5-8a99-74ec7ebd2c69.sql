ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS series_id uuid,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date;

CREATE INDEX IF NOT EXISTS calendar_events_series_id_idx
  ON public.calendar_events(series_id)
  WHERE series_id IS NOT NULL;