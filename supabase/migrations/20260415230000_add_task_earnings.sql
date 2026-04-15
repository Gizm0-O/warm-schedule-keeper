-- Add amount column to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS amount INTEGER;

-- Create task_earnings table (similar to italy_savings)
CREATE TABLE IF NOT EXISTS task_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id TEXT NOT NULL,
  todo_text TEXT NOT NULL,
  amount INTEGER NOT NULL,
  bonus_type TEXT,
  bonus_percent NUMERIC,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations on task_earnings" ON task_earnings
  FOR ALL USING (true) WITH CHECK (true);
