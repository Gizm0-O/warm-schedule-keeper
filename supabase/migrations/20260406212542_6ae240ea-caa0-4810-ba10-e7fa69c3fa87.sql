
CREATE TABLE public.shift_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_key TEXT NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('swap', 'location', 'time', 'day')),
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shift_key, override_type)
);

ALTER TABLE public.shift_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to shift_overrides" ON public.shift_overrides FOR ALL USING (true) WITH CHECK (true);
