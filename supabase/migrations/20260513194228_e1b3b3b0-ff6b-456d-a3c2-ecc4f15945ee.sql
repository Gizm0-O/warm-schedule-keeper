
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_todo_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS DISTINCT FROM true OR NEW.completed_at IS NULL) THEN
    NEW.completed_at = now();
  ELSIF NEW.completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_todos_completed_at ON public.todos;
CREATE TRIGGER trg_todos_completed_at
BEFORE INSERT OR UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.set_todo_completed_at();

-- Backfill: use latest task_earnings.completed_at if available, else created_at
UPDATE public.todos t
SET completed_at = COALESCE(
  (SELECT MAX(e.completed_at) FROM public.task_earnings e WHERE e.todo_id = t.id::text),
  t.created_at
)
WHERE t.completed = true AND t.completed_at IS NULL;
