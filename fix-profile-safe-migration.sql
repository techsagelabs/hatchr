-- ===================================================================
-- SAFE Profile Migration - Can be run multiple times without errors
-- Fixes the username column issue without failing if already exists
-- ===================================================================

-- Step 1: Add username column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT;
        RAISE NOTICE '✅ Added username column';
    ELSE
        RAISE NOTICE 'ℹ️  Username column already exists';
    END IF;
END $$;

-- Step 2: Create unique index (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'user_profiles_username_unique'
    ) THEN
        CREATE UNIQUE INDEX user_profiles_username_unique 
        ON user_profiles (LOWER(username));
        RAISE NOTICE '✅ Created unique index on username';
    ELSE
        RAISE NOTICE 'ℹ️  Unique index already exists';
    END IF;
END $$;

-- Step 3: Migrate existing data (fill in NULL usernames)
DO $$
DECLARE
    user_record RECORD;
    base_username TEXT;
    final_username TEXT;
    counter INTEGER;
BEGIN
    -- Check if there are any NULL usernames to migrate
    IF EXISTS (SELECT 1 FROM user_profiles WHERE username IS NULL LIMIT 1) THEN
        RAISE NOTICE '🔄 Migrating users with NULL usernames...';
        
        FOR user_record IN 
            SELECT id, user_id, display_name 
            FROM user_profiles 
            WHERE username IS NULL
            ORDER BY created_at ASC
        LOOP
            -- Create base username from display_name or user_id
            IF user_record.display_name IS NOT NULL AND user_record.display_name != '' THEN
                base_username := LOWER(REPLACE(REPLACE(user_record.display_name, ' ', ''), '.', ''));
                base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
            ELSE
                base_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6);
            END IF;
            
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
            
            WHILE EXISTS (SELECT 1 FROM user_profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
                final_username := base_username || '_' || counter::text;
                counter := counter + 1;
                IF counter > 999 THEN
                    final_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6) || '_' || counter::text;
                    EXIT;
                END IF;
            END LOOP;
            
            -- Update the user with the unique username
            UPDATE user_profiles 
            SET username = final_username 
            WHERE id = user_record.id;
            
            RAISE NOTICE '  ✅ Updated user % with username: %', user_record.user_id, final_username;
        END LOOP;
        
        RAISE NOTICE '✅ Migration complete';
    ELSE
        RAISE NOTICE 'ℹ️  All users already have usernames';
    END IF;
END $$;

-- Step 4: Make username NOT NULL (if not already)
DO $$
BEGIN
    -- Check if column is already NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
          AND column_name = 'username' 
          AND is_nullable = 'YES'
    ) THEN
        -- Check if there are any NULL values
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE username IS NULL) THEN
            ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;
            RAISE NOTICE '✅ Set username to NOT NULL';
        ELSE
            RAISE NOTICE '⚠️  Cannot set NOT NULL - some usernames are still NULL';
            RAISE NOTICE '   Run the migration again to fill NULL usernames';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  Username is already NOT NULL';
    END IF;
END $$;

-- Step 5: Add validation constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_format_check' 
          AND conrelid = 'user_profiles'::regclass
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT username_format_check 
        CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
        RAISE NOTICE '✅ Added username format validation constraint';
    ELSE
        RAISE NOTICE 'ℹ️  Username format constraint already exists';
    END IF;
END $$;

-- Step 6: Verify the migration
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️  No users in database'
        WHEN COUNT(*) = COUNT(username) THEN '✅ All ' || COUNT(*) || ' users have usernames'
        ELSE '⚠️  ' || (COUNT(*) - COUNT(username)) || ' users missing usernames'
    END as status,
    COUNT(*) as total_users,
    COUNT(username) as users_with_username,
    COUNT(*) - COUNT(username) as users_without_username
FROM user_profiles;

-- Show sample users
SELECT 
    id, 
    LEFT(user_id, 10) || '...' as user_id_preview,
    username, 
    display_name,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 5;

