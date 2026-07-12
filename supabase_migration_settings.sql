-- ============================================================
-- APP SETTINGS TABLE
-- Key-value store for platform configuration
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('otp_from_email', '"admin@sendme.com"', 'Sender email address for admin OTP messages'),
  ('otp_from_name', '"SendMe"', 'Sender display name for admin OTP messages'),
  ('referral_enabled', 'true', 'Enable referral feature in the SendMe mobile app')
ON CONFLICT (key) DO NOTHING;

-- RLS: only service_role touches this (dashboard uses service role key)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.app_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
