
CREATE TABLE public.finance_entries_deleted_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id uuid NOT NULL,
  month text NOT NULL,
  section text NOT NULL,
  category text,
  name text NOT NULL,
  planned numeric NOT NULL,
  actual numeric NOT NULL,
  due_day text,
  note text,
  original_created_at timestamptz,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.finance_entries_deleted_log TO authenticated;
GRANT ALL ON public.finance_entries_deleted_log TO service_role;

ALTER TABLE public.finance_entries_deleted_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read finance log"
  ON public.finance_entries_deleted_log FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "trigger inserts allowed"
  ON public.finance_entries_deleted_log FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE INDEX finance_log_deleted_at_idx ON public.finance_entries_deleted_log(deleted_at DESC);
CREATE INDEX finance_log_month_idx ON public.finance_entries_deleted_log(month);

CREATE OR REPLACE FUNCTION public.log_finance_entry_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.finance_entries_deleted_log
    (entry_id, month, section, category, name, planned, actual, due_day, note, original_created_at, deleted_by)
  VALUES
    (OLD.id, OLD.month, OLD.section, OLD.category, OLD.name, OLD.planned, OLD.actual,
     OLD.due_day, OLD.note, OLD.created_at, auth.uid());

  -- purge older than 30 days
  DELETE FROM public.finance_entries_deleted_log
   WHERE deleted_at < now() - interval '30 days';

  RETURN OLD;
END;
$$;

CREATE TRIGGER finance_entries_log_delete
BEFORE DELETE ON public.finance_entries
FOR EACH ROW
EXECUTE FUNCTION public.log_finance_entry_delete();
