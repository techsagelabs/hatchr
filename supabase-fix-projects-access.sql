-- Fix projects access issues for authenticated and anonymous users
-- Run this in your Supabase SQL Editor

-- Check current RLS policies for projects table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';

-- Disable RLS temporarily to check if that's the issue
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, create a permissive policy for SELECT
-- This allows both authenticated and anonymous users to read projects
DROP POLICY IF EXISTS "Projects are publicly readable" ON public.projects;

CREATE POLICY "Projects are publicly readable" 
ON public.projects FOR SELECT 
TO public
USING (true);

-- Also ensure authenticated users can read projects
DROP POLICY IF EXISTS "Authenticated users can read all projects" ON public.projects;

CREATE POLICY "Authenticated users can read all projects"
ON public.projects FOR SELECT
TO authenticated
USING (true);

-- Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';

-- Test query that should work for both authenticated and anonymous users
SELECT id, title, short_description, author_name, upvotes, downvotes 
FROM public.projects 
ORDER BY upvotes DESC 
LIMIT 5;
