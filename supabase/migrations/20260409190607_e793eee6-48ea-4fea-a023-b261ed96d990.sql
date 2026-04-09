
CREATE TABLE public.italy_savings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.italy_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to italy_savings"
ON public.italy_savings
FOR ALL
TO public
USING (true)
WITH CHECK (true);
