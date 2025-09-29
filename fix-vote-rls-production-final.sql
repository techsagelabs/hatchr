-- 🚀 PRODUCTION FIX: Update RLS policies for multi-layer auth approach
-- This allows both regular auth and service role operations

-- Drop existing policies on votes table
DROP POLICY IF EXISTS "Users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update votes" ON votes;
DROP POLICY IF EXISTS "Users can view votes" ON votes;
DROP POLICY IF EXISTS "Users can delete votes" ON votes;
DROP POLICY IF EXISTS "clean_votes_select" ON votes;
DROP POLICY IF EXISTS "clean_votes_insert" ON votes;
DROP POLICY IF EXISTS "clean_votes_update" ON votes;
DROP POLICY IF EXISTS "clean_votes_delete" ON votes;

-- Create comprehensive vote policies that work with both auth methods
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can manage their votes" ON votes
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  )
  WITH CHECK (
    user_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  );

-- Update project policies to allow service role updates for vote counts
DROP POLICY IF EXISTS "Users can update own projects" ON projects;

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  )
  WITH CHECK (
    author_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  );

-- Ensure projects can be read by anyone
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
CREATE POLICY "Anyone can view projects" ON projects
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Verify the policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('votes', 'projects')
ORDER BY tablename, policyname;
