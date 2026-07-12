-- Migration: Add is_suspended columns for proper suspend vs deactivate distinction
-- Run this in Supabase SQL Editor

-- Add is_suspended to users table (for senders/drivers suspend)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Add is_suspended to organization_profiles table (for org suspend)
ALTER TABLE public.organization_profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON public.users(is_suspended) WHERE is_suspended = true;
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON public.users(is_deleted) WHERE is_deleted = true;
CREATE INDEX IF NOT EXISTS idx_org_profiles_is_suspended ON public.organization_profiles(is_suspended) WHERE is_suspended = true;
