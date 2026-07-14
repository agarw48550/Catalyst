-- Ensure extensions and shared trigger function exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Job applications for Clerk-authenticated users
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_description TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr', 'or')),
  company_research JSONB DEFAULT '{}',
  research_status TEXT NOT NULL DEFAULT 'pending' CHECK (research_status IN ('pending', 'processing', 'complete', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can create own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete own job applications" ON job_applications;

CREATE POLICY "Users can view own job applications"
  ON job_applications FOR SELECT
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can create own job applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update own job applications"
  ON job_applications FOR UPDATE
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can delete own job applications"
  ON job_applications FOR DELETE
  USING (auth.jwt()->>'sub' = user_id);

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Extend interview_sessions for Clerk + job application linkage
-- Create the table if the base schema was never applied
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  transcript JSONB DEFAULT '[]',
  feedback JSONB,
  job_application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'normal', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS job_application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE interview_sessions
      ADD COLUMN difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'normal', 'hard'));
  END IF;
END $$;

-- Allow Clerk user IDs (TEXT). Safe if already TEXT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions'
      AND column_name = 'user_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE interview_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own interview sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can create own interview sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can update own interview sessions" ON interview_sessions;

CREATE POLICY "Users can view own interview sessions"
  ON interview_sessions FOR SELECT
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can create own interview sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update own interview sessions"
  ON interview_sessions FOR UPDATE
  USING (auth.jwt()->>'sub' = user_id);
