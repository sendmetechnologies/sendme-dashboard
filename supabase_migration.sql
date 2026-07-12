-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

-- Admin OTP Codes Table
CREATE TABLE IF NOT EXISTS admin_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_otp_admin_id ON admin_otp_codes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_otp_expires ON admin_otp_codes(expires_at);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Only service_role can access admin tables
CREATE POLICY "Service role full access to admin_users"
  ON admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to admin_otp_codes"
  ON admin_otp_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to admin_sessions"
  ON admin_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed super admin (password: Admin@1234)
INSERT INTO admin_users (username, email, password_hash, display_name, role, phone)
VALUES ('superadmin', 'admin@sendme.com', '$2b$10$eiJyAo2bHS8lUq6YJz791..A.gOPkGhbwj7UIEysG.aAjfIBV6mti', 'Super Admin', 'super_admin', '+2348000000000')
ON CONFLICT (username) DO NOTHING;

-- Test admin (password: Igbomalam)
INSERT INTO admin_users (username, email, password_hash, display_name, role, phone)
VALUES ('devi', 'sendmetechnologies@gmail.com', '$2b$10$gO9wOQIVkM3SdHv77bqdIug6Fxp49c8AMNgh1nlXaYI956c2Ele8i', 'Devi', 'super_admin', '+2349167658727')
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone;
