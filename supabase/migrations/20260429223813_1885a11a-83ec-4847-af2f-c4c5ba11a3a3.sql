-- Tokens balance table
CREATE TABLE public.tokens_balance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner text NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  last_weekly_grant date,
  last_monthly_grant date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tokens_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to tokens_balance"
ON public.tokens_balance FOR ALL
USING (true) WITH CHECK (true);

CREATE TRIGGER tokens_balance_updated_at
BEFORE UPDATE ON public.tokens_balance
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.tokens_balance (owner, balance) VALUES ('Barča', 5);

-- Token transactions
CREATE TABLE public.token_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner text NOT NULL DEFAULT 'Barča',
  amount integer NOT NULL,
  reason text NOT NULL,
  shift_key text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to token_transactions"
ON public.token_transactions FOR ALL
USING (true) WITH CHECK (true);

-- is_token flag on custom rewards
ALTER TABLE public.task_custom_rewards
ADD COLUMN is_token boolean NOT NULL DEFAULT false;