
CREATE TABLE public.price_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  unit text NOT NULL DEFAULT 'ks',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_tags TO authenticated;
GRANT ALL ON public.price_tags TO service_role;

ALTER TABLE public.price_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users full access price_tags"
  ON public.price_tags FOR ALL TO authenticated
  USING (public.is_approved(auth.uid()))
  WITH CHECK (public.is_approved(auth.uid()));

CREATE TRIGGER trg_price_tags_updated_at
BEFORE UPDATE ON public.price_tags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
