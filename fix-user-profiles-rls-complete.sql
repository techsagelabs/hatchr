-- ===================================================================
-- Complete RLS Policies for user_profiles
-- Run this to ensure all policies are correct
-- ===================================================================

-- Drop existing policies (if any issues)
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view profiles (public read)
CREATE POLICY "Users can view all profiles" 
ON user_profiles
FOR SELECT
USING (true);

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON user_profiles
FOR INSERT
WITH CHECK (
    (auth.jwt() ->> 'sub') IS NOT NULL AND
    (auth.jwt() ->> 'sub') = user_id
);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON user_profiles
FOR UPDATE
USING (
    (auth.jwt() ->> 'sub') = user_id
)
WITH CHECK (
    (auth.jwt() ->> 'sub') = user_id
);

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON user_profiles
FOR DELETE
USING (
    (auth.jwt() ->> 'sub') = user_id
);

-- Verify policies
SELECT 
    policyname,
    cmd as operation,
    permissive,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- Test: Check if current user can access their profile
SELECT 
    auth.uid() as current_user_id,
    (SELECT COUNT(*) FROM user_profiles WHERE user_id = auth.uid()) as profile_exists,
    (SELECT username FROM user_profiles WHERE user_id = auth.uid()) as my_username;

