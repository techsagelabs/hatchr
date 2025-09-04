-- ===================================================================
-- QUICK TEST: Minimal Supabase Storage Setup
-- Copy and run this FIRST to test image uploads
-- ===================================================================

-- Just create a public bucket - simplest approach
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-assets', 
  'project-assets', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'project-assets';

-- Check if RLS is already enabled (it should be)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- That's it! The bucket is public so uploads should work immediately
