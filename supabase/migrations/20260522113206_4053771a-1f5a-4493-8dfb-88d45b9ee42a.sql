
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Security definer: is_approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND status = 'approved')
$$;

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'pending'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger on profiles
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Replace permissive RLS on all app tables with auth+approved checks
-- Helper: drop old "Allow all" policies and add new ones

-- todos
DROP POLICY IF EXISTS "Allow all access to todos" ON public.todos;
CREATE POLICY "Approved users full access todos" ON public.todos
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- calendar_events
DROP POLICY IF EXISTS "Allow all access to calendar_events" ON public.calendar_events;
CREATE POLICY "Approved users full access calendar_events" ON public.calendar_events
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- birthdays
DROP POLICY IF EXISTS "Allow all access to birthdays" ON public.birthdays;
CREATE POLICY "Approved users full access birthdays" ON public.birthdays
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- shopping_items
DROP POLICY IF EXISTS "Allow all access to shopping_items" ON public.shopping_items;
CREATE POLICY "Approved users full access shopping_items" ON public.shopping_items
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- wishlist_items
DROP POLICY IF EXISTS "Allow all access to wishlist_items" ON public.wishlist_items;
CREATE POLICY "Approved users full access wishlist_items" ON public.wishlist_items
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- changelog_entries
DROP POLICY IF EXISTS "Allow all access to changelog_entries" ON public.changelog_entries;
CREATE POLICY "Approved users full access changelog_entries" ON public.changelog_entries
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- earned_rewards
DROP POLICY IF EXISTS "Allow all access to earned_rewards" ON public.earned_rewards;
CREATE POLICY "Approved users full access earned_rewards" ON public.earned_rewards
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- hourly_tasks
DROP POLICY IF EXISTS "Allow all access to hourly_tasks" ON public.hourly_tasks;
CREATE POLICY "Approved users full access hourly_tasks" ON public.hourly_tasks
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- italy_savings
DROP POLICY IF EXISTS "Allow all access to italy_savings" ON public.italy_savings;
CREATE POLICY "Approved users full access italy_savings" ON public.italy_savings
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- monthly_archives
DROP POLICY IF EXISTS "Allow all access to monthly_archives" ON public.monthly_archives;
CREATE POLICY "Approved users full access monthly_archives" ON public.monthly_archives
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- rewards_config
DROP POLICY IF EXISTS "Anyone can view rewards config" ON public.rewards_config;
DROP POLICY IF EXISTS "Anyone can insert rewards config" ON public.rewards_config;
DROP POLICY IF EXISTS "Anyone can update rewards config" ON public.rewards_config;
DROP POLICY IF EXISTS "Anyone can delete rewards config" ON public.rewards_config;
CREATE POLICY "Approved users full access rewards_config" ON public.rewards_config
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- shift_overrides
DROP POLICY IF EXISTS "Allow all access to shift_overrides" ON public.shift_overrides;
CREATE POLICY "Approved users full access shift_overrides" ON public.shift_overrides
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- task_bonus_amounts
DROP POLICY IF EXISTS "Allow all access to task_bonus_amounts" ON public.task_bonus_amounts;
CREATE POLICY "Approved users full access task_bonus_amounts" ON public.task_bonus_amounts
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- task_bonuses
DROP POLICY IF EXISTS "Anyone can view task bonuses" ON public.task_bonuses;
DROP POLICY IF EXISTS "Anyone can insert task bonuses" ON public.task_bonuses;
DROP POLICY IF EXISTS "Anyone can update task bonuses" ON public.task_bonuses;
DROP POLICY IF EXISTS "Anyone can delete task bonuses" ON public.task_bonuses;
CREATE POLICY "Approved users full access task_bonuses" ON public.task_bonuses
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- task_custom_rewards
DROP POLICY IF EXISTS "Allow all access to task_custom_rewards" ON public.task_custom_rewards;
CREATE POLICY "Approved users full access task_custom_rewards" ON public.task_custom_rewards
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- task_earnings
DROP POLICY IF EXISTS "Allow all operations on task_earnings" ON public.task_earnings;
CREATE POLICY "Approved users full access task_earnings" ON public.task_earnings
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- task_ready
DROP POLICY IF EXISTS "Allow all access to task_ready" ON public.task_ready;
CREATE POLICY "Approved users full access task_ready" ON public.task_ready
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- task_xp
DROP POLICY IF EXISTS "Allow all access to task_xp" ON public.task_xp;
CREATE POLICY "Approved users full access task_xp" ON public.task_xp
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- token_transactions
DROP POLICY IF EXISTS "Allow all access to token_transactions" ON public.token_transactions;
CREATE POLICY "Approved users full access token_transactions" ON public.token_transactions
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- tokens_balance
DROP POLICY IF EXISTS "Allow all access to tokens_balance" ON public.tokens_balance;
CREATE POLICY "Approved users full access tokens_balance" ON public.tokens_balance
  FOR ALL USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
