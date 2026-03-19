-- Collaboration tables for comments and version history
-- Migration: 20260318000000_collaboration_tables.sql

-- Comments table (polymorphic)
CREATE TABLE IF NOT EXISTS ews_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('chapter', 'song', 'image', 'character', 'theme', 'note', 'conversation')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chapter revisions table (version history)
CREATE TABLE IF NOT EXISTS ews_chapter_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES ews_chapters(id) ON DELETE CASCADE,
  content JSONB,
  title TEXT NOT NULL,
  summary TEXT,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_entity ON ews_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON ews_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON ews_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_revisions_chapter ON ews_chapter_revisions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_revisions_created ON ews_chapter_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapter_revisions_editor ON ews_chapter_revisions(edited_by);

-- Enable RLS
ALTER TABLE ews_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_chapter_revisions ENABLE ROW LEVEL SECURITY;

-- Comments policies
-- Users can view comments on entities they have access to (through project membership)
CREATE POLICY "Users can view comments on accessible entities"
  ON ews_comments FOR SELECT
  USING (
    CASE entity_type
      WHEN 'chapter' THEN EXISTS (
        SELECT 1 FROM ews_chapters c
        JOIN ews_project_members pm ON pm.project_id = c.project_id
        WHERE c.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'song' THEN EXISTS (
        SELECT 1 FROM ews_songs s
        JOIN ews_project_members pm ON pm.project_id = s.project_id
        WHERE s.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'image' THEN EXISTS (
        SELECT 1 FROM ews_images i
        JOIN ews_project_members pm ON pm.project_id = i.project_id
        WHERE i.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'character' THEN EXISTS (
        SELECT 1 FROM ews_characters ch
        JOIN ews_project_members pm ON pm.project_id = ch.project_id
        WHERE ch.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'theme' THEN EXISTS (
        SELECT 1 FROM ews_themes t
        JOIN ews_project_members pm ON pm.project_id = t.project_id
        WHERE t.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'note' THEN EXISTS (
        SELECT 1 FROM ews_notes n
        JOIN ews_project_members pm ON pm.project_id = n.project_id
        WHERE n.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'conversation' THEN EXISTS (
        SELECT 1 FROM ews_conversations conv
        JOIN ews_project_members pm ON pm.project_id = conv.project_id
        WHERE conv.id = entity_id AND pm.user_id = auth.uid()
      )
      ELSE false
    END
  );

-- Users can create comments on entities they have access to
CREATE POLICY "Users can create comments on accessible entities"
  ON ews_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    CASE entity_type
      WHEN 'chapter' THEN EXISTS (
        SELECT 1 FROM ews_chapters c
        JOIN ews_project_members pm ON pm.project_id = c.project_id
        WHERE c.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'song' THEN EXISTS (
        SELECT 1 FROM ews_songs s
        JOIN ews_project_members pm ON pm.project_id = s.project_id
        WHERE s.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'image' THEN EXISTS (
        SELECT 1 FROM ews_images i
        JOIN ews_project_members pm ON pm.project_id = i.project_id
        WHERE i.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'character' THEN EXISTS (
        SELECT 1 FROM ews_characters ch
        JOIN ews_project_members pm ON pm.project_id = ch.project_id
        WHERE ch.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'theme' THEN EXISTS (
        SELECT 1 FROM ews_themes t
        JOIN ews_project_members pm ON pm.project_id = t.project_id
        WHERE t.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'note' THEN EXISTS (
        SELECT 1 FROM ews_notes n
        JOIN ews_project_members pm ON pm.project_id = n.project_id
        WHERE n.id = entity_id AND pm.user_id = auth.uid()
      )
      WHEN 'conversation' THEN EXISTS (
        SELECT 1 FROM ews_conversations conv
        JOIN ews_project_members pm ON pm.project_id = conv.project_id
        WHERE conv.id = entity_id AND pm.user_id = auth.uid()
      )
      ELSE false
    END
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON ews_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON ews_comments FOR DELETE
  USING (user_id = auth.uid());

-- Chapter revisions policies
-- Users can view revisions for chapters they have access to
CREATE POLICY "Users can view chapter revisions for accessible chapters"
  ON ews_chapter_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ews_chapters c
      JOIN ews_project_members pm ON pm.project_id = c.project_id
      WHERE c.id = chapter_id AND pm.user_id = auth.uid()
    )
  );

-- Users can create revisions for chapters they have access to
CREATE POLICY "Users can create chapter revisions for accessible chapters"
  ON ews_chapter_revisions FOR INSERT
  WITH CHECK (
    edited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ews_chapters c
      JOIN ews_project_members pm ON pm.project_id = c.project_id
      WHERE c.id = chapter_id AND pm.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on comments
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at_trigger
  BEFORE UPDATE ON ews_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();
