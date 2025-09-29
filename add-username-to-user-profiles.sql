-- Add username column to user_profiles table
-- This script adds a unique username field to replace the use of display_name for usernames

-- Add the username column (initially nullable for existing users)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique 
ON user_profiles (LOWER(username));

-- Migrate existing display_name values to username for existing users
-- This handles duplicates by appending numbers
DO $$
DECLARE
    user_record RECORD;
    base_username TEXT;
    final_username TEXT;
    counter INTEGER;
BEGIN
    -- First, handle users with display_name
    FOR user_record IN 
        SELECT id, user_id, display_name 
        FROM user_profiles 
        WHERE username IS NULL 
          AND display_name IS NOT NULL 
          AND display_name != ''
        ORDER BY created_at ASC -- Older users get preference
    LOOP
        -- Create base username from display_name
        base_username := LOWER(REPLACE(REPLACE(user_record.display_name, ' ', ''), '.', ''));
        
        -- Remove any remaining special characters and ensure it's valid
        base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
        
        -- Ensure minimum length
        IF LENGTH(base_username) < 3 THEN
            base_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6);
        END IF;
        
        -- Ensure maximum length
        IF LENGTH(base_username) > 25 THEN
            base_username := SUBSTRING(base_username FROM 1 FOR 25);
        END IF;
        
        -- Check for uniqueness and append number if needed
        final_username := base_username;
        counter := 1;
        
        -- Keep trying until we find a unique username
        WHILE EXISTS (SELECT 1 FROM user_profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
            final_username := base_username || '_' || counter::text;
            counter := counter + 1;
            
            -- Safety check to prevent infinite loop
            IF counter > 999 THEN
                final_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6) || '_' || counter::text;
                EXIT;
            END IF;
        END LOOP;
        
        -- Update the user with the unique username
        UPDATE user_profiles 
        SET username = final_username 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated user % with username: %', user_record.user_id, final_username;
    END LOOP;
    
    -- Handle users without display_name
    FOR user_record IN 
        SELECT id, user_id 
        FROM user_profiles 
        WHERE username IS NULL
    LOOP
        base_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6);
        final_username := base_username;
        counter := 1;
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM user_profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
            final_username := base_username || '_' || counter::text;
            counter := counter + 1;
        END LOOP;
        
        UPDATE user_profiles 
        SET username = final_username 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated user % with generated username: %', user_record.user_id, final_username;
    END LOOP;
END $$;

-- Now make username NOT NULL since all existing users have values
ALTER TABLE user_profiles 
ALTER COLUMN username SET NOT NULL;

-- Add check constraint to ensure username format (alphanumeric and underscore only, 3-30 chars)
ALTER TABLE user_profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.username IS 'Unique username for the user (alphanumeric and underscore only, 3-30 characters)';
COMMENT ON COLUMN user_profiles.display_name IS 'Full name or display name for the user (can contain spaces and special characters)';
