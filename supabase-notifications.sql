-------------------------------------------------
-- 1) Notifications Table
-------------------------------------------------
create type public.notification_type as enum (
  'connection_request',
  'connection_accepted',
  'new_comment',
  'new_vote'
);

create table if not exists public.notifications (
  id            uuid          primary key default gen_random_uuid(),
  user_id       text          not null, -- who receives the notification
  actor_id      text,                    -- who triggered the notification (optional)
  type          notification_type not null,
  data          jsonb,                   -- { "projectId": "...", "commentId": "...", "connectionId": "..." }
  is_read       boolean       not null default false,
  created_at    timestamptz   not null default now()
);

-------------------------------------------------
-- 2) Row-Level Security for Notifications
-------------------------------------------------
alter table public.notifications enable row level security;

create policy "Notifications: select own"
  on public.notifications for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Notifications: update own (is_read)"
  on public.notifications for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check (is_read = true);

-------------------------------------------------
-- 3) Functions to create notifications (called via RPC)
-------------------------------------------------

-- Function to create a generic notification
-- This will be called from our API routes, not from DB triggers
create or replace function public.create_notification(
  target_user_id text,
  notification_type public.notification_type,
  notification_data jsonb
)
returns void
language plpgsql
security definer -- important for running with elevated privileges
set search_path = public
as $$
declare
  actor_user_id text := (auth.jwt() ->> 'sub');
begin
  -- Don't notify user about their own actions
  if target_user_id <> actor_user_id then
    insert into public.notifications(user_id, actor_id, type, data)
    values (target_user_id, actor_user_id, notification_type, notification_data);
  end if;
end;
$$;
