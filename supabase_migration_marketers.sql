-- ─────────────────────────────────────────────────────────────────────────
-- MARKETER PROFILES TABLE
-- Stores onboarding data for SendMe Growth Partners (marketers)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.marketer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Registration fields
  phone TEXT,
  state TEXT,
  city TEXT,
  occupation TEXT,
  has_sales_experience BOOLEAN DEFAULT false,
  experience_description TEXT,
  onboarded_targets_30d INTEGER,

  -- Admin-managed fields
  marketer_id TEXT UNIQUE,          -- e.g. MKT-A1B2C3, assigned on approval
  status TEXT DEFAULT 'pending'     -- pending | approved | rejected | suspended
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  review_reason TEXT,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_marketer_profiles_user_id ON public.marketer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_marketer_profiles_status ON public.marketer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_marketer_profiles_marketer_id ON public.marketer_profiles(marketer_id);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.marketer_profiles ENABLE ROW LEVEL SECURITY;

-- Marketers can read their own profile
DROP POLICY IF EXISTS "Marketers can view own profile" ON public.marketer_profiles;
CREATE POLICY "Marketers can view own profile"
  ON public.marketer_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Marketers can insert their own profile (during registration)
DROP POLICY IF EXISTS "Marketers can insert own profile" ON public.marketer_profiles;
CREATE POLICY "Marketers can insert own profile"
  ON public.marketer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Marketers can update their own profile (limited fields)
DROP POLICY IF EXISTS "Marketers can update own profile" ON public.marketer_profiles;
CREATE POLICY "Marketers can update own profile"
  ON public.marketer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_marketer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_marketer_profiles_updated ON public.marketer_profiles;
CREATE TRIGGER on_marketer_profiles_updated
  BEFORE UPDATE ON public.marketer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_marketer_profiles_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- ENABLE REALTIME (so admin dashboard can see live changes)
-- ─────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.marketer_profiles;
