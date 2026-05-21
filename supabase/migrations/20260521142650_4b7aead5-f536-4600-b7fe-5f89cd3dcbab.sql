CREATE TABLE public.birthdays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  day integer NOT NULL CHECK (day BETWEEN 1 AND 31),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.birthdays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to birthdays"
ON public.birthdays
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER set_birthdays_updated_at
BEFORE UPDATE ON public.birthdays
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.birthdays (month, day, name) VALUES
  (7, 1, 'Ruďan'),
  (7, 10, 'Taťka (Luděk)'),
  (10, 10, 'Ajka'),
  (11, 12, 'Honza + Verča'),
  (11, 16, 'Mamka (Lenka)'),
  (11, 19, 'Babička (Staňa)'),
  (12, 21, 'Leňa'),
  (7, 18, 'Mamka (Majka)'),
  (4, 12, 'Taťka (Ruda)'),
  (10, 24, 'Anička'),
  (3, 19, 'Teta (Jitka)');