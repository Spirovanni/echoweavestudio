-- Migration for AI Pipeline Jobs
-- Migration: 20260319000001_pipeline_jobs.sql

-- =============================================================================
-- Pipeline Jobs Table
-- Tracks long-running AI pipeline executions and their states
-- =============================================================================
CREATE TABLE IF NOT EXISTS ews_pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_project ON ews_pipeline_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_user ON ews_pipeline_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON ews_pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_created_at ON ews_pipeline_jobs(created_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE ews_pipeline_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view pipeline jobs"
  ON ews_pipeline_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_pipeline_jobs.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create pipeline jobs"
  ON ews_pipeline_jobs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_pipeline_jobs.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can update pipeline jobs"
  ON ews_pipeline_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_pipeline_jobs.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can delete pipeline jobs"
  ON ews_pipeline_jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_pipeline_jobs.project_id AND user_id = auth.uid()
    )
  );

-- =============================================================================
-- Triggers for updated_at timestamps
-- =============================================================================

CREATE TRIGGER update_pipeline_jobs_updated_at
  BEFORE UPDATE ON ews_pipeline_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
