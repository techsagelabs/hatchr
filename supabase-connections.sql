-------------------------------------------------
-- 1) Table definition
-------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id text         NOT NULL,
  recipient_id text         NOT NULL,
  status       text         NOT NULL
                                 CHECK (status IN ('pending','accepted','declined'))
                                 DEFAULT 'pending',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT connections_no_self
      CHECK (requester_id <> recipient_id)
  -- optional foreign keys (uncomment if you want them):
  -- , CONSTRAINT fk_requester  FOREIGN KEY (requester_id)  REFERENCES auth.users(id)
  -- , CONSTRAINT fk_recipient FOREIGN KEY (recipient_id) REFERENCES auth.users(id)
);

-- Ensure one row per pair (directional); requester → recipient is unique
CREATE UNIQUE INDEX IF NOT EXISTS connections_request_unique
  ON public.connections (requester_id, recipient_id);

-------------------------------------------------
-- 2) Row‑Level Security
-------------------------------------------------
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Read: requester or recipient can see the row
CREATE POLICY "Connections: select own"
  ON public.connections
  FOR SELECT
  USING ((auth.jwt() ->> 'sub') IN (requester_id, recipient_id));

-- Insert: only the requester can create their own request
CREATE POLICY "Connections: insert as requester"
  ON public.connections
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = requester_id);

-- Update: only the recipient can accept/decline a pending request they received
CREATE POLICY "Connections: recipient updates status"
  ON public.connections
  FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = recipient_id)
  WITH CHECK (status IN ('accepted','declined'));

-- Optional: allow requester to cancel (delete) a pending request
CREATE POLICY "Connections: requester can delete pending"
  ON public.connections
  FOR DELETE
  USING ((auth.jwt() ->> 'sub') = requester_id AND status = 'pending');

-------------------------------------------------
-- 3) Trigger to keep updated_at fresh
-------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connections_updated_at ON public.connections;
CREATE TRIGGER trg_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


