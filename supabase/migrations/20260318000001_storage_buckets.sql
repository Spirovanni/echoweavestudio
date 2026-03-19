-- Storage buckets for image uploads
-- Migration: 20260318000001_storage_buckets.sql

-- Create images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload images to their project folders
CREATE POLICY "Users can upload images to accessible projects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.uid() IS NOT NULL AND
    -- Verify user has access to the project (folder name is project_id)
    EXISTS (
      SELECT 1 FROM ews_project_members
      WHERE project_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
  );

-- Policy: Users can view images from their projects
CREATE POLICY "Users can view images from accessible projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'images' AND
    (
      -- Public bucket, so authenticated users can view
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM ews_project_members
        WHERE project_id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete their own uploaded images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.uid() = owner
  );

-- Policy: Users can update their own uploaded images
CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    auth.uid() = owner
  );
