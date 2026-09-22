BEGIN;

CREATE OR REPLACE FUNCTION public.prepare_paysera_payment(p_order_id uuid, p_amount bigint, p_url text, p_test boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR o.payment_method <> 'paysera'
    OR o.supplier_status NOT IN ('pending_supplier_check','confirmed','supplier_confirmed','awaiting_payment')
    OR o.payment_status IN ('paid','paid_review') THEN
    RAISE EXCEPTION 'Order cannot receive a payment link';
  END IF;

  IF o.paysera_test_mode IS NOT NULL AND o.paysera_test_mode IS DISTINCT FROM p_test THEN
    RAISE EXCEPTION 'Create a new order when switching between test and live payments';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0
    OR p_amount IS DISTINCT FROM round(o.total * 100)::bigint
    OR p_test IS NULL
    OR p_url IS NULL
    OR p_url !~ '^https://www[.]paysera[.]com/pay/[?]data=' THEN
    RAISE EXCEPTION 'Invalid payment preparation';
  END IF;

  IF o.paysera_payment_url = p_url
    AND o.paysera_test_mode = p_test
    AND o.payment_status = 'awaiting_payment' THEN
    RETURN to_jsonb(o);
  END IF;

  PERFORM set_config('app.paysera_server_write', 'on', true);

  UPDATE public.orders
  SET supplier_status = 'awaiting_payment',
      status = 'awaiting_payment',
      supplier_confirmed_at = coalesce(supplier_confirmed_at, now()),
      payment_status = 'awaiting_payment',
      payment_requested_at = now(),
      paysera_payment_url = p_url,
      paysera_payment_created_at = now(),
      paysera_test_mode = p_test,
      paysera_callback_status = NULL,
      paysera_callback_received_at = NULL,
      payment_review_reason = NULL
  WHERE id = p_order_id
  RETURNING * INTO o;

  RETURN to_jsonb(o);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_paysera_callback(
  p_order_number text,
  p_amount bigint,
  p_currency text,
  p_status text,
  p_test boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE order_number = p_order_number FOR UPDATE;

  IF NOT FOUND OR o.payment_method <> 'paysera' OR o.paysera_payment_url IS NULL THEN
    RAISE EXCEPTION 'Unknown payment';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0
    OR p_amount IS DISTINCT FROM round(o.total * 100)::bigint
    OR p_currency IS DISTINCT FROM 'EUR'
    OR p_test IS NULL
    OR p_test IS DISTINCT FROM o.paysera_test_mode
    OR p_status IS NULL
    OR p_status NOT IN ('0','1','2','3','4') THEN
    RAISE EXCEPTION 'Payment mismatch';
  END IF;

  IF o.payment_status IN ('paid','paid_review','test_paid') THEN
    RETURN 'already_recorded';
  END IF;

  PERFORM set_config('app.paysera_server_write', 'on', true);

  IF p_status IN ('1','3') THEN
    IF p_test THEN
      UPDATE public.orders
      SET payment_status = 'test_paid',
          paysera_callback_status = p_status,
          paysera_callback_received_at = now()
      WHERE id = o.id;
      RETURN 'test_recorded';
    END IF;

    IF o.supplier_status NOT IN ('confirmed','supplier_confirmed','awaiting_payment') THEN
      UPDATE public.orders
      SET payment_status = 'paid_review',
          paid_at = now(),
          paysera_callback_status = p_status,
          paysera_callback_received_at = now(),
          payment_review_reason = 'Payment received after the order was cancelled or its fulfilment state changed. Check Paysera and arrange fulfilment or a refund.'
      WHERE id = o.id;
      RETURN 'review_required';
    END IF;

    UPDATE public.orders
    SET payment_status = 'paid',
        paid_at = now(),
        paysera_callback_status = p_status,
        paysera_callback_received_at = now(),
        supplier_status = 'paid_awaiting_arrival',
        status = 'paid_awaiting_arrival'
    WHERE id = o.id;
    RETURN 'paid';
  END IF;

  IF o.paysera_callback_status IS DISTINCT FROM p_status THEN
    UPDATE public.orders
    SET paysera_callback_status = p_status,
        paysera_callback_received_at = now()
    WHERE id = o.id;
  END IF;

  RETURN 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_paysera_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  trusted_payment_write boolean := current_setting('app.paysera_server_write', true) = 'on';
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.paysera_test_mode IS NOT NULL OR NEW.payment_review_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Payment metadata must be server-created';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.payment_method = 'paysera'
    AND OLD.paysera_payment_url IS NOT NULL
    AND (NEW.total, NEW.subtotal, NEW.shipping, NEW.items, NEW.payment_method, NEW.order_number, NEW.email)
      IS DISTINCT FROM
        (OLD.total, OLD.subtotal, OLD.shipping, OLD.items, OLD.payment_method, OLD.order_number, OLD.email) THEN
    RAISE EXCEPTION 'An issued Paysera order cannot be repriced or reassigned';
  END IF;

  IF NOT trusted_payment_write
    AND (NEW.payment_status, NEW.paid_at, NEW.paysera_payment_url, NEW.paysera_payment_created_at,
         NEW.paysera_callback_received_at, NEW.paysera_callback_status, NEW.paysera_test_mode, NEW.payment_review_reason)
      IS DISTINCT FROM
        (OLD.payment_status, OLD.paid_at, OLD.paysera_payment_url, OLD.paysera_payment_created_at,
         OLD.paysera_callback_received_at, OLD.paysera_callback_status, OLD.paysera_test_mode, OLD.payment_review_reason) THEN
    RAISE EXCEPTION 'Only the payment server can change payment records';
  END IF;

  IF OLD.payment_method = 'paysera'
    AND NEW.supplier_status IS DISTINCT FROM OLD.supplier_status
    AND NOT trusted_payment_write THEN
    IF NOT (
      (OLD.payment_status NOT IN ('paid','paid_review')
        AND NEW.supplier_status IN ('unavailable','cancelled')
        AND OLD.supplier_status IN ('pending_supplier_check','confirmed','supplier_confirmed','awaiting_payment'))
      OR (OLD.payment_status = 'paid'
        AND OLD.supplier_status = 'paid_awaiting_arrival'
        AND NEW.supplier_status = 'ready_to_ship')
      OR (OLD.payment_status = 'paid'
        AND OLD.supplier_status = 'ready_to_ship'
        AND NEW.supplier_status = 'shipped')
    ) THEN
      RAISE EXCEPTION 'Invalid Paysera order transition';
    END IF;
  END IF;

  IF OLD.payment_method = 'paysera'
    AND NOT trusted_payment_write
    AND NEW.status IS DISTINCT FROM OLD.status
    AND NEW.status IS DISTINCT FROM NEW.supplier_status THEN
    RAISE EXCEPTION 'Order status must match fulfilment status';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_paysera_payment(uuid,bigint,text,boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_paysera_callback(text,bigint,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_paysera_payment(uuid,bigint,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_paysera_callback(text,bigint,text,text,boolean) TO service_role;

COMMIT;
