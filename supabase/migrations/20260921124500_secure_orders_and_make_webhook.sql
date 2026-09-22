-- Remove legacy public order reads and extend the existing Make status webhook
-- with the Paysera fields required by the guarded email routes.
BEGIN;

-- Customer checkout only needs INSERT access. Never expose all customer orders publicly.
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "public_select_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
REVOKE SELECT ON TABLE public.orders FROM anon;
GRANT SELECT ON TABLE public.orders TO authenticated;

-- Preserve the existing Make endpoint and COD behavior; only extend the payload.
CREATE OR REPLACE FUNCTION public.notify_make_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_status_message text;
BEGIN
  IF NEW.supplier_status IS NOT DISTINCT FROM OLD.supplier_status THEN
    RETURN NEW;
  END IF;

  v_status_message := CASE NEW.supplier_status
    WHEN 'pending_supplier_check' THEN 'Po kontrollojmë stokun dhe ju konfirmojmë me email.'
    WHEN 'confirmed' THEN 'Stoku i porosisë suaj u konfirmua.'
    WHEN 'supplier_confirmed' THEN 'Stoku i porosisë suaj u konfirmua.'
    WHEN 'awaiting_payment' THEN 'Stoku u konfirmua. Ju lutemi përfundoni pagesën për porosinë tuaj.'
    WHEN 'paid_awaiting_arrival' THEN 'Pagesa u konfirmua. Po presim që produkti të mbërrijë në dyqan.'
    WHEN 'ready_to_ship' THEN 'Produkti ka mbërritur dhe porosia po përgatitet për dërgesë.'
    WHEN 'shipped' THEN 'Porosia juaj është dërguar.'
    WHEN 'unavailable' THEN 'Na vjen keq, produkti nuk është i disponueshëm.'
    WHEN 'cancelled' THEN 'Porosia juaj është anuluar.'
    ELSE 'Ka një përditësim për porosinë tuaj.'
  END;

  PERFORM net.http_post(
    url := 'https://hook.eu1.make.com/infxdcj4l3uubanmcara2u8d4ltjocx8',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'event', 'order_status_changed',
      'id', NEW.id,
      'order_number', NEW.order_number,
      'customer_name', NEW.customer_name,
      'customer_email', NEW.email,
      'payment_method', NEW.payment_method,
      'status', NEW.supplier_status,
      'supplier_status', NEW.supplier_status,
      'previous_status', OLD.supplier_status,
      'status_message', v_status_message,
      'payment_status', NEW.payment_status,
      'paysera_payment_url', NEW.paysera_payment_url,
      'paysera_test_mode', NEW.paysera_test_mode,
      'items', NEW.items,
      'subtotal', NEW.subtotal,
      'shipping', NEW.shipping,
      'total', NEW.total,
      'changed_at', now()
    )
  );

  RETURN NEW;
END;
$function$;

COMMIT;
