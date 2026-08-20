CREATE OR REPLACE FUNCTION public.admin_hard_delete_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_role TEXT;
  v_table TEXT;
  v_marketer_ref TEXT;
  v_mk_id UUID;
BEGIN
  SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Null out self-references
  UPDATE public.users SET referred_by = NULL WHERE referred_by = p_user_id;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='linked_org_id') THEN
    UPDATE public.users SET linked_org_id = NULL WHERE linked_org_id = p_user_id;
  END IF;

  -- Generic cleanup: delete from all child tables that reference this user
  FOREACH v_table IN ARRAY ARRAY[
    'order_tracking', 'bids', 'driver_return_interests',
    'return_load_plans', 'online_sessions',
    'complaints', 'ratings', 'referrals',
    'return_load_negotiations', 'virtual_accounts', 'wallet_funding_tracking',
    'user_points', 'user_tasks', 'points_transactions', 'user_achievements',
    'saved_places', 'email_verifications', 'phone_verifications',
    'notification_preferences', 'email_rate_limits', 'email_logs',
    'messages', 'chat_messages', 'notification_logs',
    'wallets', 'payment_methods', 'transactions',
    'payout_methods', 'payout_requests',
    'organization_drivers'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='driver_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE driver_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='sender_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE sender_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='rater_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE rater_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='rated_user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE rated_user_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='referrer_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE referrer_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='referred_user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE referred_user_id = $1', v_table) USING p_user_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table AND column_name='from_user_id') THEN
        EXECUTE format('DELETE FROM public.%I WHERE from_user_id = $1', v_table) USING p_user_id;
      END IF;
    END IF;
  END LOOP;

  -- Cross-role cleanup: any user (customer/driver/org) may also have marketer data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketer_profiles') THEN
    -- Get the marketer ref_id before cleaning up
    SELECT marketer_id INTO v_marketer_ref FROM public.marketer_profiles WHERE user_id = p_user_id;

    -- Only delete active marketer data; keep 'removed' profiles so lists show "removed marketer"
    DELETE FROM public.marketer_profiles WHERE user_id = p_user_id AND status != 'removed';

    -- Also clean up canonical marketer rows if they exist
    IF v_marketer_ref IS NOT NULL THEN
      SELECT id INTO v_mk_id FROM public.marketers WHERE ref_id = v_marketer_ref;
      IF v_mk_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketer_wallets') THEN
          DELETE FROM public.marketer_wallets WHERE marketer_id = v_mk_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketer_wallet_transactions') THEN
          DELETE FROM public.marketer_wallet_transactions WHERE marketer_id = v_mk_id;
        END IF;
        DELETE FROM public.marketers WHERE id = v_mk_id;
      END IF;
    END IF;
  END IF;

  -- Role-specific cleanup
  IF v_user_role = 'driver' THEN
    UPDATE public.orders SET accepted_driver_id = NULL WHERE accepted_driver_id = p_user_id;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_vehicles') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organization_vehicles' AND column_name='assigned_driver_id') THEN
        UPDATE public.organization_vehicles SET assigned_driver_id = NULL WHERE assigned_driver_id = p_user_id;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='driver_profiles') THEN
      DELETE FROM public.driver_profiles WHERE id = p_user_id;
    END IF;

  ELSIF v_user_role = 'customer' THEN
    DELETE FROM public.transactions WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_funding_tracking' AND column_name='order_id') THEN
      DELETE FROM public.wallet_funding_tracking WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    END IF;
    DELETE FROM public.orders WHERE customer_id = p_user_id;

  ELSIF v_user_role = 'organization' THEN
    DELETE FROM public.transactions WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_funding_tracking' AND column_name='order_id') THEN
      DELETE FROM public.wallet_funding_tracking WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = p_user_id);
    END IF;
    DELETE FROM public.orders WHERE customer_id = p_user_id;

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
    -- Already handled by cross-role cleanup above
    NULL;
  END IF;

  -- Delete the user row
  DELETE FROM public.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'User permanently deleted');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$
