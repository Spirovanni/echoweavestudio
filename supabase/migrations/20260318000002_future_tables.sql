-- Future-recommended tables for Echo Weave Studio
-- Migration: 20260318000002_future_tables.sql

-- =============================================================================
-- Notes Table
-- Flexible note-taking system for capturing ideas, brainstorming, and research
-- =============================================================================
CREATE TABLE IF NOT EXISTS ews_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_project ON ews_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON ews_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON ews_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON ews_notes USING GIN(tags);

-- =============================================================================
-- AI Generations Table
-- Tracks all AI-generated content for auditing and reference
-- =============================================================================
CREATE TABLE IF NOT EXISTS ews_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('plot', 'outline', 'story', 'assist', 'copilot')),
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  source_entity_type TEXT CHECK (source_entity_type IN ('chapter', 'song', 'image', 'conversation', 'character', 'theme', 'note')),
  source_entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_project ON ews_ai_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_tool ON ews_ai_generations(tool_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_source ON ews_ai_generations(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ews_ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_metadata ON ews_ai_generations USING GIN(metadata);

-- =============================================================================
-- Project Settings Table
-- Project-level configuration and feature flags
-- =============================================================================
CREATE TABLE IF NOT EXISTS ews_project_settings (
  project_id UUID PRIMARY KEY REFERENCES ews_projects(id) ON DELETE CASCADE,
  adult_module_enabled BOOLEAN NOT NULL DEFAULT false,
  publishing_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  collaboration_enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_settings_settings ON ews_project_settings USING GIN(settings);

-- =============================================================================
-- Activity Events Table
-- Comprehensive activity/audit logging for tracking all project actions
-- =============================================================================
CREATE TABLE IF NOT EXISTS ews_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'updated', 'deleted',
    'status_changed', 'linked', 'unlinked',
    'ai_generated', 'exported', 'imported',
    'member_added', 'member_removed', 'settings_changed'
  )),
  entity_type TEXT CHECK (entity_type IN ('project', 'chapter', 'song', 'image', 'conversation', 'character', 'theme', 'note')),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_project ON ews_activity_events(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user ON ews_activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON ews_activity_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON ews_activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_event_type ON ews_activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_metadata ON ews_activity_events USING GIN(metadata);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE ews_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_activity_events ENABLE ROW LEVEL SECURITY;

-- Notes Policies
CREATE POLICY "Project members can view notes"
  ON ews_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_notes.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create notes"
  ON ews_notes FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_notes.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can update notes"
  ON ews_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_notes.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can delete notes"
  ON ews_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_notes.project_id AND user_id = auth.uid()
    )
  );

-- AI Generations Policies
CREATE POLICY "Project members can view AI generations"
  ON ews_ai_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_ai_generations.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create AI generations"
  ON ews_ai_generations FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_ai_generations.project_id AND user_id = auth.uid()
    )
  );

-- Project Settings Policies
CREATE POLICY "Project members can view settings"
  ON ews_project_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_project_settings.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage settings"
  ON ews_project_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_project_settings.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Activity Events Policies
CREATE POLICY "Project members can view activity"
  ON ews_activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_activity_events.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create activity events"
  ON ews_activity_events FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id = ews_activity_events.project_id AND user_id = auth.uid()
    )
  );

-- =============================================================================
-- Triggers for updated_at timestamps
-- =============================================================================

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON ews_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at
  BEFORE UPDATE ON ews_project_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Default project settings on project creation
-- =============================================================================

CREATE OR REPLACE FUNCTION create_default_project_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ews_project_settings (project_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_project_settings_trigger
  AFTER INSERT ON ews_projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_project_settings();
