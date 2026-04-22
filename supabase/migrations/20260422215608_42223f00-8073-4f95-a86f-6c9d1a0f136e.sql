CREATE TABLE public.task_bonus_amounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id text NOT NULL UNIQUE,
  amount integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_bonus_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to task_bonus_amounts"
ON public.task_bonus_amounts FOR ALL
USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at_task_bonus_amounts
BEFORE UPDATE ON public.task_bonus_amounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_bonus_amounts;