-- ========================================
-- FIX USER_PROFILES RLS FOR PUBLIC BROWSING
-- ========================================
-- This allows anonymous users to view user avatars and profiles
-- Required for public browsing functionality

-- Update RLS policies for user_profiles table
DROP POLICY IF EXISTS "Read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public read access" ON public.user_profiles;

-- Allow public read access to user profiles (for displaying avatars, etc.)
CREATE POLICY "Public read access" 
ON public.user_profiles 
FOR SELECT 
USING (true);

-- Users can still only insert/update their own profiles
CREATE POLICY "Users can insert own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.user_profiles TO anon;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Test the policy by selecting a profile (should work now)
-- SELECT display_name, avatar_url FROM user_profiles LIMIT 1;
