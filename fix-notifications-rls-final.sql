-- Fix Notifications RLS Policies
-- This ensures users only see their own notifications

-- 1. Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing notification policies to start fresh
DROP POLICY IF EXISTS "Notifications: select own" ON notifications;
DROP POLICY IF EXISTS "Notifications: update own (is_read)" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- 3. Create clean, working notification policies

-- Policy: Users can only SELECT their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

-- Policy: Users can only UPDATE their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Policy: Allow creation of notifications (for system/service operations)
CREATE POLICY "notifications_insert_system" ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- System can create notifications for any user

-- 4. Verify the policies are working
-- Test query (should only return current user's notifications)
-- SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid()::text;

-- 5. Ensure notification_type enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'connection_request',
            'connection_accepted', 
            'new_comment',
            'new_vote'
        );
    END IF;
END $$;

-- 6. Check if notifications table has correct structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type notification_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
        ALTER TABLE notifications ADD COLUMN actor_id TEXT;
    END IF;
END $$;

-- 7. Add helpful comments
COMMENT ON TABLE notifications IS 'User notifications with RLS to ensure users only see their own notifications';
COMMENT ON COLUMN notifications.user_id IS 'The user who should receive this notification';
COMMENT ON COLUMN notifications.actor_id IS 'The user who triggered this notification (optional)';
COMMENT ON COLUMN notifications.type IS 'Type of notification (connection_request, new_vote, etc.)';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification (project_id, comment_id, etc.)';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read this notification';

-- 8. Test the policies (uncomment to run manually)
-- SELECT 
--     schemaname,
--     tablename, 
--     policyname,
--     cmd,
--     roles
-- FROM pg_policies 
-- WHERE tablename = 'notifications';

RAISE NOTICE 'Notifications RLS policies updated successfully!';
RAISE NOTICE 'Users will now only see their own notifications.';
