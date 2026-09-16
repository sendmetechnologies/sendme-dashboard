-- Allow the "individuals" target audience for email campaigns.
ALTER TABLE public.email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_target_audience_check;
ALTER TABLE public.email_campaigns ADD CONSTRAINT email_campaigns_target_audience_check
  CHECK (target_audience IN ('all', 'marketers', 'senders', 'riders', 'organizations', 'individuals'));
