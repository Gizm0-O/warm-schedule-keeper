-- From 20260415230000_add_task_earnings.sql
ALTER TABLE todos ADD COLUMN IF NOT EXISTS amount INTEGER;

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

ALTER TABLE task_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on task_earnings" ON task_earnings
  FOR ALL USING (true) WITH CHECK (true);

-- From 20260415240000_add_italia_savings.sql (fixed table name to italy_savings)
ALTER TABLE italy_savings ADD COLUMN IF NOT EXISTS bonus_percent NUMERIC DEFAULT 0;

-- RLS and policy already exist on italy_savings, skip