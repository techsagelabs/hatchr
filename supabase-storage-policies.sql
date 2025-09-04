-- Allow authenticated users to upload (INSERT) files to specific bucket
CREATE POLICY "Authenticated users can upload to project-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-assets');

-- Public read access to the same bucket
CREATE POLICY "Public can view project assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-assets');

-- Users can update their own files (using owner column, compare UUIDs)
CREATE POLICY "Users can update own files in project-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-assets' AND owner = auth.uid());

-- Users can delete their own files (using owner column)
CREATE POLICY "Users can delete own files in project-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-assets' AND owner = auth.uid());

-- (Optional) If you prefer to use the new owner_id text column, you can replace the last two policies with:
-- USING (bucket_id = 'project-assets' AND owner_id = auth.uid()::text);