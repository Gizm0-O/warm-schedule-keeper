-- Přidat sloupce pro identifikaci série "Příběhy"
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS story_number integer,
  ADD COLUMN IF NOT EXISTS story_month text;

CREATE INDEX IF NOT EXISTS idx_todos_story ON public.todos(story_month, story_number);

-- Funkce: vygeneruje 6 příběhů pro daný měsíc (YYYY-MM)
-- Termíny = středy a neděle od prvního takového dne >= 5. v měsíci
CREATE OR REPLACE FUNCTION public.generate_stories_for_month(p_month text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_first date;
  v_cursor date;
  v_count int := 0;
  v_story_num int := 1;
  v_dow int;
  v_amount int;
  v_existing int;
BEGIN
  -- Pokud už pro tento měsíc příběhy existují, nic nedělej
  SELECT COUNT(*) INTO v_existing FROM public.todos WHERE story_month = p_month;
  IF v_existing > 0 THEN
    RETURN;
  END IF;

  v_first := to_date(p_month || '-05', 'YYYY-MM-DD');
  v_cursor := v_first;

  WHILE v_count < 6 LOOP
    v_dow := EXTRACT(DOW FROM v_cursor); -- 0=ne, 3=st
    IF v_dow = 0 OR v_dow = 3 THEN
      v_count := v_count + 1;
      v_amount := 4500;
      INSERT INTO public.todos (text, completed, category, person, deadline, recurrence, amount, story_number, story_month)
      VALUES (
        'Napsat příběh ' || v_count,
        false,
        'prace',
        'barca',
        v_cursor,
        'none',
        v_amount,
        v_count,
        p_month
      );
      -- Bonus 2000 Kč pro 6. příběh
      IF v_count = 6 THEN
        INSERT INTO public.task_bonus_amounts (todo_id, amount)
        SELECT id::text, 2000 FROM public.todos
        WHERE story_month = p_month AND story_number = 6
        LIMIT 1;
      END IF;
    END IF;
    v_cursor := v_cursor + 1;
  END LOOP;
END;
$$;

-- Povolit pg_cron a pg_net pro automatické generování 1. v měsíci
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cron job: 1. den v měsíci v 00:05 vygeneruje příběhy pro aktuální měsíc
SELECT cron.unschedule('generate-stories-monthly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-stories-monthly'
);

SELECT cron.schedule(
  'generate-stories-monthly',
  '5 0 1 * *',
  $$ SELECT public.generate_stories_for_month(to_char(now(), 'YYYY-MM')); $$
);