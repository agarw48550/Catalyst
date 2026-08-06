-- Ensure shared updated_at trigger helper exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Track per-user activity for inactivity cleanup (Clerk user IDs as TEXT)
CREATE TABLE IF NOT EXISTS user_activity (
  user_id TEXT PRIMARY KEY,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  warning_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_last_active_at
  ON user_activity(last_active_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_warning_sent_at
  ON user_activity(warning_sent_at)
  WHERE warning_sent_at IS NOT NULL;

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can upsert own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can update own activity" ON user_activity;

CREATE POLICY "Users can view own activity"
  ON user_activity FOR SELECT
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can upsert own activity"
  ON user_activity FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update own activity"
  ON user_activity FOR UPDATE
  USING (auth.jwt()->>'sub' = user_id);

DROP TRIGGER IF EXISTS update_user_activity_updated_at ON user_activity;
CREATE TRIGGER update_user_activity_updated_at
  BEFORE UPDATE ON user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
