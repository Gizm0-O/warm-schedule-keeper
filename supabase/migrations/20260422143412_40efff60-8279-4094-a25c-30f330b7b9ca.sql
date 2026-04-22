CREATE TABLE public.task_ready (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_ready ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to task_ready"
ON public.task_ready
FOR ALL
USING (true)
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_ready;