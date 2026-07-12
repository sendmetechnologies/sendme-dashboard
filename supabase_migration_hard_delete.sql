-- ============================================================
-- ADMIN HARD DELETE FUNCTION
-- Handles all FK dependencies before deleting a user
-- Run in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_hard_delete_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_table TEXT;
  v_has_col BOOLEAN;
BEGIN
  -- Get the user's role
  SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- ══════════════════════════════════════════════
  -- DRIVER-specific cleanup
  -- ══════════════════════════════════════════════
  IF v_user_role = 'driver' THEN
    -- Nullify nullable FK references first
    UPDATE public.orders SET accepted_driver_id = NULL WHERE accepted_driver_id = p_user_id;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_vehicles') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organization_vehicles' AND column_name='assigned_driver_id') THEN
        UPDATE public.organization_vehicles SET assigned_driver_id = NULL WHERE assigned_driver_id = p_user_id;
      END IF;
    END IF;

    -- Delete driver-specific child rows (order matters for FK chains)
    FOREACH v_table IN ARRAY ARRAY[
      'order_tracking', 'bids', 'driver_return_interests',
      'return_load_plans', 'online_sessions'
    ] LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='driver_id') THEN
          EXECUTE format('DELETE FROM public.%I WHERE driver_id = $1', v_table) USING p_user_id;
        END IF;
      END IF;
    END LOOP;

    -- Junction tables referencing driver_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_drivers') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organization_drivers' AND column_name='driver_id') THEN
        DELETE FROM public.organization_drivers WHERE driver_id = p_user_id;
      END IF;
    END IF;

    -- driver_profiles (PK = id, references users.id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='driver_profiles') THEN
      DELETE FROM public.driver_profiles WHERE id = p_user_id;
    END IF;

    -- Shared user-level tables (check both user_id and driver_id columns)
    FOREACH v_table IN ARRAY ARRAY[
      'user_points', 'user_tasks', 'points_transactions', 'user_achievements',
      'saved_places', 'email_verifications', 'phone_verifications',
      'notification_preferences', 'email_rate_limits', 'email_logs',
      'messages', 'chat_messages', 'notification_logs',
      'wallets', 'payment_methods', 'transactions'
    ] LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='user_id') THEN
          EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_table) USING p_user_id;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='driver_id') THEN
          EXECUTE format('DELETE FROM public.%I WHERE driver_id = $1', v_table) USING p_user_id;
        END IF;
      END IF;
    END LOOP;

  -- ══════════════════════════════════════════════
  -- CUSTOMER-specific cleanup
  -- ══════════════════════════════════════════════
  ELSIF v_user_role = 'customer' THEN
    -- Delete orders (bids cascade via order_id ON DELETE CASCADE)
    DELETE FROM public.orders WHERE customer_id = p_user_id;

    -- Shared user-level tables
    FOREACH v_table IN ARRAY ARRAY[
      'user_points', 'user_tasks', 'points_transactions', 'user_achievements',
      'saved_places', 'email_verifications', 'phone_verifications',
      'notification_preferences', 'email_rate_limits', 'email_logs',
      'messages', 'chat_messages', 'notification_logs',
      'wallets', 'payment_methods', 'transactions'
    ] LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='user_id') THEN
          EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_table) USING p_user_id;
        END IF;
      END IF;
    END LOOP;

  -- ══════════════════════════════════════════════
  -- ORGANIZATION-specific cleanup
  -- ══════════════════════════════════════════════
  ELSIF v_user_role = 'organization' THEN
    -- Delete orders (bids cascade via order_id ON DELETE CASCADE)
    DELETE FROM public.orders WHERE customer_id = p_user_id;

    -- Organization-specific child tables
    FOREACH v_table IN ARRAY ARRAY[
      'organization_activity_logs', 'organization_insights',
      'organization_payout_requests', 'organization_payout_methods',
      'organization_wallets', 'organization_vehicles',
      'organization_drivers', 'organization_sub_admins',
      'organization_profiles'
    ] LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
        IF v_table = 'organization_profiles' THEN
          EXECUTE format('DELETE FROM public.%I WHERE id = $1', v_table) USING p_user_id;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='organization_id') THEN
          EXECUTE format('DELETE FROM public.%I WHERE organization_id = $1', v_table) USING p_user_id;
        END IF;
      END IF;
    END LOOP;

    -- Shared user-level tables
    FOREACH v_table IN ARRAY ARRAY[
      'user_points', 'user_tasks', 'points_transactions', 'user_achievements',
      'saved_places', 'email_verifications', 'phone_verifications',
      'notification_preferences', 'email_rate_limits', 'email_logs',
      'messages', 'chat_messages', 'notification_logs',
      'wallets', 'payment_methods', 'transactions'
    ] LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='user_id') THEN
          EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_table) USING p_user_id;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- ══════════════════════════════════════════════
  -- Finally delete the user row itself
  -- ══════════════════════════════════════════════
  -- Nullify self-referencing FK (users.referred_by -> users.id)
  UPDATE public.users SET referred_by = NULL WHERE referred_by = p_user_id;

  DELETE FROM public.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'User permanently deleted');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to service_role (dashboard uses service role key)
GRANT EXECUTE ON FUNCTION public.admin_hard_delete_user(UUID) TO service_role;
-- Also grant to authenticated in case needed
GRANT EXECUTE ON FUNCTION public.admin_hard_delete_user(UUID) TO authenticated;
