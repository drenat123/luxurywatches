-- Trigger-only helper functions must not be callable through PostgREST RPC.
BEGIN;
REVOKE ALL ON FUNCTION public.notify_make_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_checkout_order() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_make_order_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_checkout_order() TO service_role;
COMMIT;
