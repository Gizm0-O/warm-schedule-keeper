-- Custom rewards (poukázky) system
-- 1) Templates attached to todos (admin-defined)
CREATE TABLE public.task_custom_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id TEXT NOT NULL,
  label TEXT NOT NULL,
  repeat_on_recurring BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_custom_rewards_todo_id ON public.task_custom_rewards(todo_id);

ALTER TABLE public.task_custom_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to task_custom_rewards"
  ON public.task_custom_rewards FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_task_custom_rewards_updated_at
  BEFORE UPDATE ON public.task_custom_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Earned reward instances (vouchers Barča owns)
CREATE TABLE public.earned_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_reward_id UUID,
  todo_id TEXT,
  todo_text TEXT,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT earned_rewards_status_check CHECK (status IN ('available','active','completed'))
);

CREATE INDEX idx_earned_rewards_status ON public.earned_rewards(status);
CREATE INDEX idx_earned_rewards_todo_id ON public.earned_rewards(todo_id);

ALTER TABLE public.earned_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to earned_rewards"
  ON public.earned_rewards FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_earned_rewards_updated_at
  BEFORE UPDATE ON public.earned_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();