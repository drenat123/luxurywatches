BEGIN;

CREATE OR REPLACE FUNCTION public.notify_make_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_status_message text;
BEGIN
  IF NEW.supplier_status IS NOT DISTINCT FROM OLD.supplier_status
     AND NEW.paysera_payment_url IS NOT DISTINCT FROM OLD.paysera_payment_url THEN
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
      'event', CASE
        WHEN NEW.supplier_status IS DISTINCT FROM OLD.supplier_status THEN 'order_status_changed'
        ELSE 'paysera_payment_link_changed'
      END,
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

DROP TRIGGER IF EXISTS notify_make_order_status_change ON public.orders;

CREATE TRIGGER notify_make_order_status_change
AFTER UPDATE OF supplier_status, paysera_payment_url ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_make_order_status_change();

REVOKE ALL ON FUNCTION public.notify_make_order_status_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_make_order_status_change() TO service_role;

COMMIT;
