-- ===================================================================
-- Supabase Storage Setup for Project Images
-- Run this in your Supabase SQL Editor to set up image storage
-- ===================================================================

-- Create the storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload project images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-assets' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'project-images'
  );

-- Policy: Allow public read access to project images
CREATE POLICY "Public read access for project images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-assets' AND
    (storage.foldername(name))[1] = 'project-images'
  );

-- Policy: Allow users to update their own uploads
CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-assets' AND
    auth.uid()::text = owner AND
    (storage.foldername(name))[1] = 'project-images'
  );

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-assets' AND
    auth.uid()::text = owner AND
    (storage.foldername(name))[1] = 'project-images'
  );

-- Create a function to clean up unused images (optional)
CREATE OR REPLACE FUNCTION cleanup_unused_project_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete images that are not referenced in any project
  DELETE FROM storage.objects
  WHERE bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] = 'project-images'
    AND NOT EXISTS (
      SELECT 1 FROM projects 
      WHERE thumbnail_url LIKE '%' || objects.name || '%'
    )
    AND created_at < NOW() - INTERVAL '24 hours'; -- Only delete files older than 24 hours
END;
$$;

-- Optional: Set up automatic cleanup (run weekly)
-- You can set this up as a cron job or trigger it manually
-- SELECT cleanup_unused_project_images();
