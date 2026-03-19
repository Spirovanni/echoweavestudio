-- =============================================================================
-- Echo Weave Studio — Entity Relationship (Junction) Tables
-- Links chapters to songs, images, conversations, characters, and themes
-- =============================================================================

-- chapter <-> song
CREATE TABLE ews_chapter_songs (
  chapter_id UUID NOT NULL REFERENCES ews_chapters(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES ews_songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chapter_id, song_id)
);

CREATE INDEX idx_chapter_songs_song ON ews_chapter_songs(song_id);

-- chapter <-> image
CREATE TABLE ews_chapter_images (
  chapter_id UUID NOT NULL REFERENCES ews_chapters(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES ews_images(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chapter_id, image_id)
);

CREATE INDEX idx_chapter_images_image ON ews_chapter_images(image_id);

-- chapter <-> conversation
CREATE TABLE ews_chapter_conversations (
  chapter_id UUID NOT NULL REFERENCES ews_chapters(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES ews_conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chapter_id, conversation_id)
);

CREATE INDEX idx_chapter_conversations_conversation ON ews_chapter_conversations(conversation_id);

-- chapter <-> character
CREATE TABLE ews_chapter_characters (
  chapter_id UUID NOT NULL REFERENCES ews_chapters(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES ews_characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chapter_id, character_id)
);

CREATE INDEX idx_chapter_characters_character ON ews_chapter_characters(character_id);

-- chapter <-> theme
CREATE TABLE ews_chapter_themes (
  chapter_id UUID NOT NULL REFERENCES ews_chapters(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES ews_themes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chapter_id, theme_id)
);

CREATE INDEX idx_chapter_themes_theme ON ews_chapter_themes(theme_id);

-- =============================================================================
-- Row Level Security — same pattern: project members can manage links
-- Access is derived from the chapter's project_id
-- =============================================================================

ALTER TABLE ews_chapter_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_chapter_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_chapter_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_chapter_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_chapter_themes ENABLE ROW LEVEL SECURITY;

-- RLS policies for junction tables
-- Users who can access the chapter can manage its links

CREATE POLICY "Project members can view chapter-song links"
  ON ews_chapter_songs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can manage chapter-song links"
  ON ews_chapter_songs FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can view chapter-image links"
  ON ews_chapter_images FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can manage chapter-image links"
  ON ews_chapter_images FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can view chapter-conversation links"
  ON ews_chapter_conversations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can manage chapter-conversation links"
  ON ews_chapter_conversations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can view chapter-character links"
  ON ews_chapter_characters FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can manage chapter-character links"
  ON ews_chapter_characters FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can view chapter-theme links"
  ON ews_chapter_themes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));

CREATE POLICY "Project members can manage chapter-theme links"
  ON ews_chapter_themes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ews_chapters c
    WHERE c.id = chapter_id AND public.is_project_member(c.project_id)
  ));
