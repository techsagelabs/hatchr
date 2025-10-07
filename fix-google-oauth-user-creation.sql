-- ===================================================================
-- Fix Google OAuth User Creation Error
-- ===================================================================
-- This fixes the "Database error saving new user" issue for Google OAuth
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Step 1: Add username column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Step 2: Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- Step 3: Update the trigger to handle Google OAuth users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username TEXT;
    email_prefix TEXT;
    username_suffix TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Try to get username from metadata (for email/password signups)
    new_username := NEW.raw_user_meta_data->>'username';
    
    -- If no username, generate one from email (for Google OAuth)
    IF new_username IS NULL OR new_username = '' THEN
        -- Extract part before @ from email
        email_prefix := split_part(NEW.email, '@', 1);
        
        -- Clean the email prefix (remove special characters, convert to lowercase)
        email_prefix := lower(regexp_replace(email_prefix, '[^a-z0-9]', '', 'g'));
        
        -- Limit to 20 characters
        email_prefix := substring(email_prefix from 1 for 20);
        
        -- Try to find an available username
        new_username := email_prefix;
        
        -- If username exists, add random suffix
        WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) AND attempt_count < max_attempts LOOP
            username_suffix := floor(random() * 10000)::text;
            new_username := email_prefix || username_suffix;
            attempt_count := attempt_count + 1;
        END LOOP;
        
        -- If still can't find unique username, use UUID
        IF EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) THEN
            new_username := 'user_' || substring(NEW.id::text from 1 for 8);
        END IF;
    END IF;
    
    -- Insert user profile with generated/provided username
    INSERT INTO public.user_profiles (
        user_id,
        username,
        display_name,
        avatar_url
    )
    VALUES (
        NEW.id::text,
        new_username,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            new_username
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'  -- Google provides 'picture' not 'avatar_url'
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If username conflict occurs despite checks, try with UUID
        INSERT INTO public.user_profiles (
            user_id,
            username,
            display_name,
            avatar_url
        )
        VALUES (
            NEW.id::text,
            'user_' || substring(NEW.id::text from 1 for 12),
            COALESCE(
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'full_name',
                NEW.email
            ),
            COALESCE(
                NEW.raw_user_meta_data->>'avatar_url',
                NEW.raw_user_meta_data->>'picture'
            )
        );
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't block user creation
        RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Backfill username for existing users (optional)
-- This generates usernames for any existing user_profiles without one
UPDATE public.user_profiles
SET username = 'user_' || substring(user_id from 1 for 12)
WHERE username IS NULL;

-- Step 6: Add constraint to ensure username is always set
-- (Run this AFTER backfilling existing users)
-- ALTER TABLE public.user_profiles 
-- ALTER COLUMN username SET NOT NULL;

-- Verification
SELECT 
    'User profiles table updated successfully' as status,
    COUNT(*) as total_profiles,
    COUNT(username) as profiles_with_username
FROM public.user_profiles;

-- Test the trigger (this will show what the trigger function looks like)
\sf public.handle_new_user

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates user profile when user signs up. Generates username from email for OAuth users.';

