-- ============================================================
-- SendMe Complaint & Resolution System
-- Migration: complaints, complaint_messages, complaint_admin_notes
-- ============================================================

-- 1. Complaints table (one thread per user at a time)
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('customer', 'driver', 'organization')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL CHECK (category IN ('order', 'payment', 'driver', 'app', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_id TEXT,
  assigned_admin_id UUID,
  assigned_admin_name TEXT,
  auto_close_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_count_user INT NOT NULL DEFAULT 0,
  unread_count_admin INT NOT NULL DEFAULT 0
);

-- 2. Complaint messages
CREATE TABLE IF NOT EXISTS public.complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Admin internal notes (never visible to users)
CREATE TABLE IF NOT EXISTS public.complaint_admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  admin_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_user_role ON public.complaints(user_role);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_admin ON public.complaints(assigned_admin_id) WHERE assigned_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint ON public.complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_created ON public.complaint_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_complaint_admin_notes_complaint ON public.complaint_admin_notes(complaint_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_complaint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS complaints_updated_at ON public.complaints;
CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaint_timestamp();

-- Auto-close function: close complaints past their auto_close_at
CREATE OR REPLACE FUNCTION auto_close_complaints()
RETURNS INT AS $$
DECLARE
  closed_count INT;
BEGIN
  UPDATE public.complaints
  SET status = 'closed', updated_at = now()
  WHERE status IN ('open', 'in_progress')
    AND auto_close_at < now();
  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark messages as read when admin views a complaint
CREATE OR REPLACE FUNCTION mark_complaint_messages_read(
  p_complaint_id UUID,
  p_reader_type TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_reader_type = 'admin' THEN
    UPDATE public.complaint_messages
    SET is_read = true
    WHERE complaint_id = p_complaint_id AND sender_type = 'user' AND is_read = false;
    UPDATE public.complaints
    SET unread_count_admin = 0
    WHERE id = p_complaint_id;
  ELSIF p_reader_type = 'user' THEN
    UPDATE public.complaint_messages
    SET is_read = true
    WHERE complaint_id = p_complaint_id AND sender_type = 'admin' AND is_read = false;
    UPDATE public.complaints
    SET unread_count_user = 0
    WHERE id = p_complaint_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get complaint stats for dashboard
CREATE OR REPLACE FUNCTION get_complaint_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM public.complaints),
    'open', (SELECT COUNT(*) FROM public.complaints WHERE status = 'open'),
    'in_progress', (SELECT COUNT(*) FROM public.complaints WHERE status = 'in_progress'),
    'resolved', (SELECT COUNT(*) FROM public.complaints WHERE status = 'resolved'),
    'closed', (SELECT COUNT(*) FROM public.complaints WHERE status = 'closed'),
    'by_role', (SELECT json_build_object(
      'customer', (SELECT COUNT(*) FROM public.complaints WHERE user_role = 'customer'),
      'driver', (SELECT COUNT(*) FROM public.complaints WHERE user_role = 'driver'),
      'organization', (SELECT COUNT(*) FROM public.complaints WHERE user_role = 'organization')
    )),
    'by_category', (SELECT json_build_object(
      'order', (SELECT COUNT(*) FROM public.complaints WHERE category = 'order'),
      'payment', (SELECT COUNT(*) FROM public.complaints WHERE category = 'payment'),
      'driver', (SELECT COUNT(*) FROM public.complaints WHERE category = 'driver'),
      'app', (SELECT COUNT(*) FROM public.complaints WHERE category = 'app'),
      'other', (SELECT COUNT(*) FROM public.complaints WHERE category = 'other')
    ))
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_admin_notes ENABLE ROW LEVEL SECURITY;

-- Complaints: users can read their own, service_role manages all
CREATE POLICY "Users read own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own complaints"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: users can read messages in their own complaints
CREATE POLICY "Users read own complaint messages"
  ON public.complaint_messages FOR SELECT
  USING (
    complaint_id IN (
      SELECT id FROM public.complaints WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own complaint messages"
  ON public.complaint_messages FOR INSERT
  WITH CHECK (
    complaint_id IN (
      SELECT id FROM public.complaints WHERE user_id = auth.uid()
    )
  );

-- Admin notes: NO user access, service_role only
CREATE POLICY "Service role manages admin notes"
  ON public.complaint_admin_notes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to service_role (dashboard uses this)
GRANT ALL ON public.complaints TO service_role;
GRANT ALL ON public.complaint_messages TO service_role;
GRANT ALL ON public.complaint_admin_notes TO service_role;
GRANT EXECUTE ON FUNCTION auto_close_complaints TO service_role;
GRANT EXECUTE ON FUNCTION mark_complaint_messages_read TO service_role;
GRANT EXECUTE ON FUNCTION get_complaint_stats TO service_role;

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;
