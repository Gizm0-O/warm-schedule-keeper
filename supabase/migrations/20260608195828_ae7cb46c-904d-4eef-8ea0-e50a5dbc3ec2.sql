CREATE OR REPLACE FUNCTION public.notify_todo_assigned()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.person IS NOT DISTINCT FROM OLD.person THEN
    RETURN NEW;
  END IF;
  IF NEW.recurrence IS NOT NULL AND NEW.recurrence <> 'none' THEN
    RETURN NEW;
  END IF;
  v_uid := public.person_to_user_id(NEW.person);
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, title, body, type, todo_id)
  VALUES (v_uid, 'Nový úkol', NEW.text, 'task_assigned', NEW.id);
  RETURN NEW;
END;
$function$;