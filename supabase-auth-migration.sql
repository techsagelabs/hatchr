-- =============================================================================
-- Supabase Auth Migration: Update RLS Policies for Supabase Built-in Auth
-- =============================================================================
-- This script updates all RLS policies to use auth.uid() instead of Clerk JWT
-- Run this after switching from Clerk to Supabase authentication

-- Drop all existing policies that use Clerk JWT
-- =============================================================================

-- Projects table policies
DROP POLICY IF EXISTS "Everyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;

-- Comments table policies
DROP POLICY IF EXISTS "Everyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;

-- Votes table policies
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;
DROP POLICY IF EXISTS "vote_select" ON public.votes;
DROP POLICY IF EXISTS "vote_insert" ON public.votes;
DROP POLICY IF EXISTS "vote_update" ON public.votes;
DROP POLICY IF EXISTS "vote_delete" ON public.votes;
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

-- User profiles table policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.user_profiles;

-- Connections table policies
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can insert connection requests" ON public.connections;
DROP POLICY IF EXISTS "Recipients can update connection status" ON public.connections;
DROP POLICY IF EXISTS "Requesters can delete pending connections" ON public.connections;

-- Notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create new policies using Supabase auth.uid()
-- =============================================================================

-- Projects table policies
CREATE POLICY "Everyone can view projects" ON public.projects
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert projects" ON public.projects
    FOR INSERT TO public WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE TO public USING (auth.uid()::text = author_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE TO public USING (auth.uid()::text = author_id);

-- Comments table policies
CREATE POLICY "Everyone can view comments" ON public.comments
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
    FOR INSERT TO public WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE TO public USING (auth.uid()::text = author_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE TO public USING (auth.uid()::text = author_id);

-- Votes table policies
CREATE POLICY "Everyone can view votes" ON public.votes
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert votes" ON public.votes
    FOR INSERT TO public WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

CREATE POLICY "Users can update their own votes" ON public.votes
    FOR UPDATE TO public USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own votes" ON public.votes
    FOR DELETE TO public USING (auth.uid()::text = user_id);

-- User profiles table policies
CREATE POLICY "Everyone can view user profiles" ON public.user_profiles
    FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT TO public WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE TO public USING (auth.uid()::text = user_id);

-- Connections table policies
CREATE POLICY "Users can view their connections" ON public.connections
    FOR SELECT TO public USING (
        auth.uid()::text = requester_id OR auth.uid()::text = recipient_id
    );

CREATE POLICY "Authenticated users can create connection requests" ON public.connections
    FOR INSERT TO public WITH CHECK (
        auth.uid() IS NOT NULL AND auth.uid()::text = requester_id
    );

CREATE POLICY "Recipients can update connection status" ON public.connections
    FOR UPDATE TO public USING (auth.uid()::text = recipient_id);

CREATE POLICY "Requesters can delete pending connections" ON public.connections
    FOR DELETE TO public USING (
        auth.uid()::text = requester_id AND status = 'pending'
    );

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT TO public USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE TO public USING (auth.uid()::text = user_id);

-- Update user_profiles table to handle Supabase auth users
-- =============================================================================

-- Add trigger to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing records if needed (run carefully in production)
-- =============================================================================

COMMENT ON POLICY "Everyone can view projects" ON public.projects IS 'Updated for Supabase auth';
COMMENT ON POLICY "Authenticated users can insert projects" ON public.projects IS 'Updated for Supabase auth';
COMMENT ON POLICY "Users can update their own projects" ON public.projects IS 'Updated for Supabase auth';
COMMENT ON POLICY "Users can delete their own projects" ON public.projects IS 'Updated for Supabase auth';

COMMENT ON POLICY "Everyone can view comments" ON public.comments IS 'Updated for Supabase auth';
COMMENT ON POLICY "Authenticated users can insert comments" ON public.comments IS 'Updated for Supabase auth';
COMMENT ON POLICY "Users can update their own comments" ON public.comments IS 'Updated for Supabase auth';
COMMENT ON POLICY "Users can delete their own comments" ON public.comments IS 'Updated for Supabase auth';

COMMENT ON POLICY "Everyone can view votes" ON public.votes IS 'Updated for Supabase auth';
COMMENT ON POLICY "Authenticated users can insert votes" ON public.votes IS 'Updated for Supabase auth';
COMMENT ON POLICY "Users can update their own votes" ON public.votes IS 'Updated for Supabase auth';
COMMENT ON POLICY "Users can delete their own votes" ON public.votes IS 'Updated for Supabase auth';

-- Verification queries
-- =============================================================================

-- Uncomment these to verify the policies are working correctly:

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- SELECT auth.uid() as current_user_id;

-- Test queries (run after authentication):
-- SELECT * FROM user_profiles WHERE user_id = auth.uid()::text;
-- SELECT * FROM projects LIMIT 5;
-- SELECT * FROM votes WHERE user_id = auth.uid()::text;
