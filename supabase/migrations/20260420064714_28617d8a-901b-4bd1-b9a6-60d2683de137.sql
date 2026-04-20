-- Rewards config (per month, single shared row per month)
CREATE TABLE IF NOT EXISTS public.rewards_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL UNIQUE,
  monthly_earnings NUMERIC NOT NULL DEFAULT 0,
  base_percent NUMERIC NOT NULL DEFAULT 10,
  bonus_per_task NUMERIC NOT NULL DEFAULT 1,
  bonus_late NUMERIC NOT NULL DEFAULT 0.5,
  max_tasks INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rewards config" ON public.rewards_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rewards config" ON public.rewards_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rewards config" ON public.rewards_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete rewards config" ON public.rewards_config FOR DELETE USING (true);

-- Task bonuses (status per todo)
CREATE TABLE IF NOT EXISTS public.task_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task bonuses" ON public.task_bonuses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert task bonuses" ON public.task_bonuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update task bonuses" ON public.task_bonuses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete task bonuses" ON public.task_bonuses FOR DELETE USING (true);

-- updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_rewards_config_updated ON public.rewards_config;
CREATE TRIGGER trg_rewards_config_updated BEFORE UPDATE ON public.rewards_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_task_bonuses_updated ON public.task_bonuses;
CREATE TRIGGER trg_task_bonuses_updated BEFORE UPDATE ON public.task_bonuses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();