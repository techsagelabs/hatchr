-- ===================================================================
-- Supabase Storage Setup for Project Images (FIXED VERSION)
-- This version works with regular user permissions
-- ===================================================================

-- Create the storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Note: storage.objects already has RLS enabled by default in Supabase
-- We don't need to run "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;"
-- because that requires superuser permissions and it's already enabled

-- Policy: Allow authenticated users to upload images to project-images folder
CREATE POLICY "Authenticated users can upload project images" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
    bucket_id = 'project-assets' 
    AND (storage.foldername(name))[1] = 'project-images'
);

-- Policy: Allow public read access to project images
CREATE POLICY "Public read access for project images" 
ON storage.objects
FOR SELECT 
TO public
USING (
    bucket_id = 'project-assets' 
    AND (storage.foldername(name))[1] = 'project-images'
);

-- Policy: Allow users to update their own uploads (based on owner column)
CREATE POLICY "Users can update their own uploads" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
    bucket_id = 'project-assets'
    AND auth.uid()::text = owner
    AND (storage.foldername(name))[1] = 'project-images'
);

-- Policy: Allow users to delete their own uploads (based on owner column)
CREATE POLICY "Users can delete their own uploads" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
    bucket_id = 'project-assets'
    AND auth.uid()::text = owner 
    AND (storage.foldername(name))[1] = 'project-images'
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'project-assets';
