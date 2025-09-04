-- ===================================================================
-- SIMPLEST Storage Setup - Just Create Bucket (No RLS Policies)
-- Use this if the fixed version still has permission issues
-- ===================================================================

-- Create the storage bucket for project assets (public bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- That's it! Since the bucket is public, anyone can read files
-- and authenticated users can upload by default

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'project-assets';
