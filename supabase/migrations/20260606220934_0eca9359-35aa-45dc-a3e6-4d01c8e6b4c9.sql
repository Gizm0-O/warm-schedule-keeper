
CREATE TABLE public.gift_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner text NOT NULL,
  name text NOT NULL,
  description text,
  url text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_wishes TO authenticated;
GRANT ALL ON public.gift_wishes TO service_role;
ALTER TABLE public.gift_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users full access gift_wishes" ON public.gift_wishes
  FOR ALL TO authenticated
  USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE TRIGGER trg_gift_wishes_updated BEFORE UPDATE ON public.gift_wishes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gift_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  name text NOT NULL,
  description text,
  url text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_ideas TO authenticated;
GRANT ALL ON public.gift_ideas TO service_role;
ALTER TABLE public.gift_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users full access gift_ideas" ON public.gift_ideas
  FOR ALL TO authenticated
  USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE TRIGGER trg_gift_ideas_updated BEFORE UPDATE ON public.gift_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
