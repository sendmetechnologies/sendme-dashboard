-- Add purpose column to admin_otp_codes so step-up (sensitive view) OTPs
-- are distinct from login OTPs and cannot consume each other.
ALTER TABLE public.admin_otp_codes ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'login';

CREATE INDEX IF NOT EXISTS idx_admin_otp_purpose
  ON public.admin_otp_codes(admin_id, purpose, used, expires_at);
