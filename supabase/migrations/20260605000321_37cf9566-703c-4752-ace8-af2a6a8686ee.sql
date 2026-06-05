
-- 1. Link profiles to person key
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS person_key text UNIQUE;

UPDATE public.profiles SET person_key = 'Barca'  WHERE email = 'hornova.b@seznam.cz';
UPDATE public.profiles SET person_key = 'Tadeas' WHERE email = 'tadeaskadlec@centrum.cz';

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'custom',
  link text,
  todo_id uuid,
  read_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Approved users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()));

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Helper: map person string -> profile user_id
CREATE OR REPLACE FUNCTION public.person_to_user_id(_person text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.profiles
  WHERE person_key = CASE
    WHEN _person = 'Barča'  THEN 'Barca'
    WHEN _person = 'Tadeáš' THEN 'Tadeas'
    ELSE _person
  END
  LIMIT 1
$$;

-- 4. Trigger: notify on todo assignment
CREATE OR REPLACE FUNCTION public.notify_todo_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.person IS NOT DISTINCT FROM OLD.person THEN
    RETURN NEW;
  END IF;
  v_uid := public.person_to_user_id(NEW.person);
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, title, body, type, todo_id)
  VALUES (v_uid, 'Nový úkol', NEW.text, 'task_assigned', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_todo_assigned ON public.todos;
CREATE TRIGGER trg_notify_todo_assigned
AFTER INSERT OR UPDATE OF person ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.notify_todo_assigned();
