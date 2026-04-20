ALTER TABLE public.rewards_config REPLICA IDENTITY FULL;
ALTER TABLE public.task_bonuses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_bonuses;