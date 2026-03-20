-- =============================================================================
-- Echo Weave Studio — Publishing Support
-- Adds published flag to images + anonymous read policies for published content
-- =============================================================================

-- Add published column to ews_images (chapters use status='published' instead)
ALTER TABLE ews_images ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for efficiently querying published content
CREATE INDEX idx_images_published ON ews_images(published) WHERE published = TRUE;
CREATE INDEX idx_chapters_published ON ews_chapters(status) WHERE status = 'published';

-- =============================================================================
-- Anonymous read access for published content
-- =============================================================================

CREATE POLICY "Anyone can view published chapters"
  ON ews_chapters FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Anyone can view published images"
  ON ews_images FOR SELECT
  TO anon
  USING (published = TRUE);

-- Allow anonymous users to see the project title for published content context
CREATE POLICY "Anyone can view projects with published content"
  ON ews_projects FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM ews_chapters
      WHERE ews_chapters.project_id = id AND ews_chapters.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM ews_images
      WHERE ews_images.project_id = id AND ews_images.published = TRUE
    )
  );
