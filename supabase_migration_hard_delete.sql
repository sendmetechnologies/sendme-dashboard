-- ============================================================
-- ADMIN HARD DELETE FUNCTION (v2)
-- Handles ALL FK dependencies before deleting a user
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
BEGIN
  SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- ══════════════════════════════════════════════
  -- SHARED cross-role cleanup (tables with FKs to users.id used by all roles)
  -- ══════════════════════════════════════════════

  -- Nullify self-referencing FKs first
  UPDATE public.users SET referred_by = NULL WHERE referred_by = p_user_id;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='linked_org_id') THEN
    UPDATE public.users SET linked_org_id = NULL WHERE linked_org_id = p_user_id;
  END IF;

  -- Delete shared child rows (order matters for FK chains)
  FOREACH v_table IN ARRAY ARRAY[
    'order_tracking', 'bids', 'driver_return_interests',
    'return_load_plans', 'online_sessions',
    'complaints', 'ratings', 'referrals',
    'return_load_negotiations', 'virtual_accounts', 'wallet_funding_tracking',
    'user_points', 'user_tasks', 'points_transactions', 'user_achievements',
    'saved_places', 'email_verifications', 'phone_verifications',
    'notification_preferences', 'email_rate_limits', 'email_logs',
    'messages', 'chat_messages', 'notification_logs',
    'wallets', 'payment_methods', 'transactions'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
      -- Try user_id column
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try driver_id column
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='driver_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE driver_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try sender_id column (chat_messages)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='sender_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE sender_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try rater_id column (ratings)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='rater_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE rater_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try rated_user_id column (ratings)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='rated_user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE rated_user_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try referrer_id column (referrals)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='referrer_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE referrer_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try referred_user_id column (referrals)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='referred_user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE referred_user_id = $1', v_table) USING p_user_id;
      END IF;
      -- Try from_user_id column (return_load_negotiations)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='from_user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE from_user_id = $1', v_table) USING p_user_id;
      END IF;
    END IF;
  END LOOP;

  -- ══════════════════════════════════════════════
  -- ROLE-SPECIFIC cleanup
  -- ══════════════════════════════════════════════

  IF v_user_role = 'driver' THEN
    -- Nullify orders referencing this driver
    UPDATE public.orders SET accepted_driver_id = NULL WHERE accepted_driver_id = p_user_id;

    -- Nullify vehicle assignments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_vehicles') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organization_vehicles' AND column_name='assigned_driver_id') THEN
        UPDATE public.organization_vehicles SET assigned_driver_id = NULL WHERE assigned_driver_id = p_user_id;
      END IF;
    END IF;

    -- Remove from organization_drivers junction
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_drivers') THEN
      DELETE FROM public.organization_drivers WHERE user_id = p_user_id;
    END IF;

    -- Delete driver profile
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='driver_profiles') THEN
      DELETE FROM public.driver_profiles WHERE id = p_user_id;
    END IF;

  ELSIF v_user_role = 'customer' THEN
    -- Delete transactions referencing this user's orders (e.g. driver payouts with order_id FK)
    DELETE FROM public.transactions WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    -- Also clean wallet_funding_tracking by order_id if it has that column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_funding_tracking' AND column_name='order_id') THEN
      DELETE FROM public.wallet_funding_tracking WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    END IF;
    DELETE FROM public.orders WHERE customer_id = p_user_id;

  ELSIF v_user_role = 'organization' THEN
    -- Delete transactions referencing this user's orders first
    DELETE FROM public.transactions WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_funding_tracking' AND column_name='order_id') THEN
      DELETE FROM public.wallet_funding_tracking WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    END IF;
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

  ELSIF v_user_role = 'marketer' THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketer_profiles') THEN
      DELETE FROM public.marketer_profiles WHERE user_id = p_user_id;
    END IF;

  END IF;

  -- ══════════════════════════════════════════════
  -- Finally delete the user row itself
  -- ══════════════════════════════════════════════
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
