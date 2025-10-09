-- ⚡ INSTANT VOTE UPDATES: Enable Realtime for Votes Table
-- Run this in Supabase SQL Editor to ensure instant vote updates

-- ⚠️ IMPORTANT: First check if votes table is already in realtime publication
-- Run this query first:
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' AND tablename = 'votes';
-- 
-- If it returns a row, votes is ALREADY enabled - skip the ALTER PUBLICATION line below!

-- 1. Enable Realtime on the votes table (ONLY if not already enabled)
-- If you get error "already member of publication", it means it's already enabled - that's good!
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- 2. Verify realtime is enabled (check if votes table is in the publication)
-- You can run this to confirm:
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' AND tablename = 'votes';

-- 3. Ensure RLS policies allow reading votes for realtime subscriptions
-- Users should be able to see all votes (for realtime updates)
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
CREATE POLICY "Anyone can view votes" 
ON votes FOR SELECT 
TO authenticated, anon
USING (true);

-- 4. Users can only insert/update/delete their own votes
DROP POLICY IF EXISTS "Users can manage their own votes" ON votes;
CREATE POLICY "Users can manage their own votes" 
ON votes FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Grant necessary permissions for realtime
GRANT SELECT ON votes TO anon, authenticated;

-- 6. Create index on project_id for faster realtime queries
CREATE INDEX IF NOT EXISTS votes_project_id_idx ON votes(project_id);
CREATE INDEX IF NOT EXISTS votes_user_id_idx ON votes(user_id);

-- 7. Add comment for documentation
COMMENT ON TABLE votes IS 'Vote records with realtime enabled for instant UI updates';

-- ✅ VERIFICATION STEPS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Go to Database > Replication in Supabase Dashboard
-- 3. Verify "votes" table is listed under "Tables in Realtime Publication"
-- 4. If not listed, manually enable it in the UI by toggling the switch
-- 5. Test by voting on a project - updates should be instant!

-- 🔍 DEBUGGING:
-- If realtime still doesn't work, check:
-- 1. Browser console for "Votes subscription status: SUBSCRIBED"
-- 2. Supabase Dashboard > Database > Replication > verify votes table is enabled
-- 3. Check that your Supabase project has realtime enabled (it's on by default)

SELECT 'Votes realtime setup complete! ⚡' as status;

