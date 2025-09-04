-- ===================================================================
-- SIMPLEST FIX: Allow all authenticated users to upload
-- Use this if you want to get uploads working immediately
-- ===================================================================

-- Allow any authenticated user to do anything with project-assets bucket
CREATE POLICY "Allow authenticated users full access to project-assets" 
ON storage.objects
FOR ALL 
TO authenticated
USING (bucket_id = 'project-assets')
WITH CHECK (bucket_id = 'project-assets');

-- Allow public read access
CREATE POLICY "Allow public read access to project-assets" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'project-assets');

-- Test the policy
SELECT * FROM storage.objects WHERE bucket_id = 'project-assets' LIMIT 1;
