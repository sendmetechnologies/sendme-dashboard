-- Allow the complaint message notification trigger to write type COMPLAINT.
-- The trigger on complaint_messages inserts a row into messages with
-- type = 'COMPLAINT', but the check constraint only allowed
-- SYSTEM, ORDER, PAYMENT and ADMIN, which blocked admin replies.
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('SYSTEM', 'ORDER', 'PAYMENT', 'ADMIN', 'COMPLAINT'));
