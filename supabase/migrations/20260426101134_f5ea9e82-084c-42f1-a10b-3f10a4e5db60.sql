-- Tabulka pro archivované měsíce (snapshots motivačního panelu)
CREATE TABLE public.monthly_archives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month text NOT NULL UNIQUE, -- formát "YYYY-MM"
  -- Souhrnná čísla (denormalizovaná pro rychlé zobrazení)
  total_earned integer NOT NULL DEFAULT 0,         -- "Vyděláno"
  allowance_amount integer NOT NULL DEFAULT 0,     -- "Kapesné" (základ + bonus)
  base_amount integer NOT NULL DEFAULT 0,          -- jen základ
  bonus_amount integer NOT NULL DEFAULT 0,         -- jen bonus
  to_hand_over integer NOT NULL DEFAULT 0,         -- "K odevzdání" = vyděláno - kapesné
  total_percent numeric NOT NULL DEFAULT 0,        -- finální %
  total_bonus_percent numeric NOT NULL DEFAULT 0,  -- bonusové %
  completed_on_time integer NOT NULL DEFAULT 0,
  completed_late integer NOT NULL DEFAULT 0,
  completed_missed integer NOT NULL DEFAULT 0,
  -- Plné snapshoty pro editaci a zobrazení
  earnings_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  bonuses_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  config_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  hourly_tasks_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  closed_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to monthly_archives"
ON public.monthly_archives
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_monthly_archives_month ON public.monthly_archives(month DESC);

CREATE TRIGGER update_monthly_archives_updated_at
BEFORE UPDATE ON public.monthly_archives
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();