-- Real-time Performance Optimization for Hatchr
-- Run this in your Supabase SQL Editor

-- 1. OPTIMIZED INDEXES for better real-time performance
-- These indexes will speed up the real-time queries significantly

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_net_votes_desc ON public.projects(net_votes DESC);
CREATE INDEX IF NOT EXISTS idx_projects_author_id_created_at ON public.projects(author_id, created_at DESC);

-- Votes indexes for real-time vote updates
CREATE INDEX IF NOT EXISTS idx_votes_project_id_user_id ON public.votes(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id_created_at ON public.votes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_created_at_desc ON public.votes(created_at DESC);

-- Comments indexes for real-time comment updates
CREATE INDEX IF NOT EXISTS idx_comments_project_id_created_at ON public.comments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_id_created_at ON public.comments(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

-- Connections indexes for real-time connection updates
CREATE INDEX IF NOT EXISTS idx_connections_requester_id_status ON public.connections(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_recipient_id_status ON public.connections(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_created_at_desc ON public.connections(created_at DESC);

-- Notifications indexes for real-time notification updates
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id_read ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id_created_at ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created_at ON public.notifications(type, created_at DESC);

-- 2. ENABLE REAL-TIME for all tables
-- This ensures Supabase sends real-time updates for these tables

ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- 3. OPTIMIZED DATABASE FUNCTIONS for better performance

-- Function to get project with vote counts (used by real-time updates)
CREATE OR REPLACE FUNCTION get_project_with_votes(project_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  short_description TEXT,
  full_description TEXT,
  thumbnail_url TEXT,
  media_url TEXT,
  code_embed_url TEXT,
  author_id TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  upvotes BIGINT,
  downvotes BIGINT,
  net_votes INTEGER,
  comments_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    p.id,
    p.title,
    p.short_description,
    p.full_description,
    p.thumbnail_url,
    p.media_url,
    p.code_embed_url,
    p.author_id,
    p.author_name,
    p.author_avatar_url,
    COALESCE(v_up.upvotes, 0) as upvotes,
    COALESCE(v_down.downvotes, 0) as downvotes,
    p.net_votes,
    COALESCE(c.comments_count, 0) as comments_count,
    p.created_at,
    p.updated_at
  FROM public.projects p
  LEFT JOIN (
    SELECT project_id, COUNT(*) as upvotes 
    FROM public.votes 
    WHERE vote_type = 'up' 
    GROUP BY project_id
  ) v_up ON p.id = v_up.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as downvotes 
    FROM public.votes 
    WHERE vote_type = 'down' 
    GROUP BY project_id
  ) v_down ON p.id = v_down.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as comments_count 
    FROM public.comments 
    GROUP BY project_id
  ) c ON p.id = c.project_id
  WHERE p.id = project_uuid;
$$;

-- 4. TRIGGERS to update net_votes in real-time
-- This ensures vote counts are always accurate

CREATE OR REPLACE FUNCTION update_project_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update net_votes for the affected project
  UPDATE public.projects 
  SET 
    net_votes = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
      FROM public.votes 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    upvotes = (
      SELECT COALESCE(COUNT(*), 0)
      FROM public.votes 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
      AND vote_type = 'up'
    ),
    downvotes = (
      SELECT COALESCE(COUNT(*), 0)
      FROM public.votes 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
      AND vote_type = 'down'
    )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for vote count updates
DROP TRIGGER IF EXISTS trigger_update_project_vote_counts_insert ON public.votes;
DROP TRIGGER IF EXISTS trigger_update_project_vote_counts_update ON public.votes;
DROP TRIGGER IF EXISTS trigger_update_project_vote_counts_delete ON public.votes;

CREATE TRIGGER trigger_update_project_vote_counts_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_vote_counts();

CREATE TRIGGER trigger_update_project_vote_counts_update
  AFTER UPDATE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_vote_counts();

CREATE TRIGGER trigger_update_project_vote_counts_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_vote_counts();

-- 5. TRIGGER to update comment counts in real-time
CREATE OR REPLACE FUNCTION update_project_comment_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update comments_count for the affected project
  UPDATE public.projects 
  SET comments_count = (
    SELECT COALESCE(COUNT(*), 0)
    FROM public.comments 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for comment count updates
DROP TRIGGER IF EXISTS trigger_update_project_comment_counts_insert ON public.comments;
DROP TRIGGER IF EXISTS trigger_update_project_comment_counts_delete ON public.comments;

CREATE TRIGGER trigger_update_project_comment_counts_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comment_counts();

CREATE TRIGGER trigger_update_project_comment_counts_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comment_counts();

-- 6. VERIFY real-time is working
-- Run this to test real-time functionality
SELECT 'Real-time optimization complete!' as status;

-- Check which tables are enabled for real-time
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Show index information
SELECT 
  indexname, 
  tablename, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'votes', 'comments', 'connections', 'notifications')
ORDER BY tablename, indexname;
