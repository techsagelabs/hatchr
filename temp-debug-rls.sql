-- ===================================================================
-- TEMPORARY DEBUG RLS POLICIES - FOR TESTING ONLY
-- This removes RLS temporarily to test if the JWT issue is the only problem
-- DO NOT USE IN PRODUCTION
-- ===================================================================

-- Temporarily disable RLS to test basic connectivity
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;  
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;

-- Test: Try to create a project now
-- If this works, the issue is purely JWT verification

-- TO RE-ENABLE SECURITY LATER, run:
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
