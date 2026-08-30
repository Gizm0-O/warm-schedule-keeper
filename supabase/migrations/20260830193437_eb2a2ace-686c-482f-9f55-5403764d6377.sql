ALTER TABLE public.hourly_tasks ADD COLUMN IF NOT EXISTS position integer;

WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.hourly_tasks
)
UPDATE public.hourly_tasks t
SET position = ranked.rn
FROM ranked
WHERE t.id = ranked.id AND t.position IS NULL;

ALTER TABLE public.hourly_tasks ALTER COLUMN position SET DEFAULT 0;