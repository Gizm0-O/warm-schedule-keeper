
-- Todos table
CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('work', 'home')),
  person TEXT NOT NULL CHECK (person IN ('Tadeáš', 'Barča')),
  deadline DATE,
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'every2days', 'every3days', 'weekly', 'biweekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to todos" ON public.todos FOR ALL USING (true) WITH CHECK (true);

-- Shopping items table
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  bought BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'ostatni',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to shopping_items" ON public.shopping_items FOR ALL USING (true) WITH CHECK (true);

-- Wishlist items table
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to wishlist_items" ON public.wishlist_items FOR ALL USING (true) WITH CHECK (true);

-- Calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  hour INTEGER,
  end_hour INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to calendar_events" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

-- Insert initial todos
INSERT INTO public.todos (text, completed, category, person, deadline, recurrence) VALUES
  ('Dokončit video', false, 'work', 'Tadeáš', '2026-04-04', 'none'),
  ('Postnout Stories', false, 'work', 'Tadeáš', '2026-04-05', 'none'),
  ('Udělat Reel', false, 'work', 'Tadeáš', '2026-04-06', 'none'),
  ('Vysát', false, 'home', 'Tadeáš', '2026-04-05', 'weekly'),
  ('Vytřít', false, 'home', 'Tadeáš', '2026-04-07', 'weekly'),
  ('Nakrmit kočky', false, 'home', 'Tadeáš', '2026-04-05', 'daily'),
  ('Napsat příběh 1', false, 'work', 'Barča', '2026-04-03', 'none'),
  ('Práce pro Vyhraj', false, 'work', 'Barča', '2026-04-03', 'none'),
  ('Napsat příběh 2', false, 'work', 'Barča', '2026-04-10', 'none'),
  ('Uvařit oběd', false, 'home', 'Barča', '2026-04-06', 'none'),
  ('Snídaně', false, 'home', 'Barča', '2026-04-07', 'daily'),
  ('Večeře', false, 'home', 'Barča', '2026-04-08', 'daily');

-- Insert initial shopping items
INSERT INTO public.shopping_items (name, quantity, bought, category) VALUES
  ('Banány', 3, false, 'ovoce_zelenina'),
  ('Kuřecí prsa', 1, false, 'maso_uzeniny'),
  ('Mléko', 2, false, 'mlecne'),
  ('Rohlíky', 10, false, 'pecivo'),
  ('Šampon', 1, false, 'drogerie'),
  ('Rajčata', 4, false, 'ovoce_zelenina'),
  ('Jogurt', 3, true, 'mlecne'),
  ('Čokoláda', 1, true, 'sladkosti');

-- Insert initial wishlist items
INSERT INTO public.wishlist_items (name, done) VALUES
  ('Šroubky M5 do police', false),
  ('Baterie AAA do koupelny', false),
  ('Komoda do ložnice', false),
  ('LED žárovka E27', false),
  ('Prodlužovací kabel 3m', true);
