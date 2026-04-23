CREATE OR REPLACE FUNCTION public.generate_stories_for_month(p_month text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_first date;
  v_cursor date;
  v_count int := 0;
  v_dow int;
  v_existing int;
  v_new_id uuid;
BEGIN
  SELECT COUNT(*) INTO v_existing FROM public.todos WHERE story_month = p_month;
  IF v_existing > 0 THEN
    RETURN;
  END IF;

  v_first := to_date(p_month || '-05', 'YYYY-MM-DD');
  v_cursor := v_first;

  WHILE v_count < 6 LOOP
    v_dow := EXTRACT(DOW FROM v_cursor);
    IF v_dow = 0 OR v_dow = 3 THEN
      v_count := v_count + 1;
      INSERT INTO public.todos (text, completed, category, person, deadline, recurrence, amount, story_number, story_month)
      VALUES (
        'Napsat příběh ' || v_count,
        false,
        'work',
        'Barča',
        v_cursor,
        'none',
        4500,
        v_count,
        p_month
      )
      RETURNING id INTO v_new_id;

      IF v_count = 6 THEN
        INSERT INTO public.task_bonus_amounts (todo_id, amount)
        VALUES (v_new_id::text, 2000);
      END IF;
    END IF;
    v_cursor := v_cursor + 1;
  END LOOP;
END;
$$;