-- Add amount column to italia_savings table
ALTER TABLE italia_savings ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0;

-- Add bonus_percent column to italia_savings table
ALTER TABLE italia_savings ADD COLUMN IF NOT EXISTS bonus_percent NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE italia_savings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now – you can restrict later)
CREATE POLICY "Allow all operations on italia_savings" ON italia_savings
  FOR ALL USING (true) WITH CHECK (true);
