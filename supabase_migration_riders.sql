-- Fix column names to match SendMe app's actual schema
-- The app uses "review_reason" not "rejection_reason"
ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS review_reason TEXT;

ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
