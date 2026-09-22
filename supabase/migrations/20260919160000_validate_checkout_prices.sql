-- Run once in Supabase SQL Editor. Existing orders and email webhooks are preserved.
-- The browser price check improves UX; this trigger is the authoritative price check.
BEGIN;
CREATE OR REPLACE FUNCTION public.validate_checkout_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  item jsonb;
  product public.products%ROWTYPE;
  product_id uuid;
  quantity integer;
  canonical_items jsonb := '[]'::jsonb;
  seen_ids uuid[] := '{}';
  expected_subtotal numeric(10,2) := 0;
  expected_shipping numeric(10,2);
BEGIN
  IF NEW.payment_method IS DISTINCT FROM 'cod' THEN
    RAISE EXCEPTION 'Pagesa online nuk është ende aktive. Zgjidhni pagesën në dorëzim.';
  END IF;
  IF NEW.supplier_status IS DISTINCT FROM 'pending_supplier_check'
    OR NEW.status NOT IN ('pending', 'pending_supplier_check')
    OR NEW.supplier_confirmed_at IS NOT NULL OR NEW.paid_at IS NOT NULL
    OR NEW.payment_requested_at IS NOT NULL OR NEW.fulfilled_at IS NOT NULL
    OR NEW.supplier_notes IS NOT NULL THEN
    RAISE EXCEPTION 'Porosia duhet të fillojë në pritje të konfirmimit të stokut.';
  END IF;
  NEW.customer_name := btrim(NEW.customer_name);
  NEW.email := lower(btrim(NEW.email));
  NEW.phone := btrim(NEW.phone);
  NEW.address := btrim(NEW.address);
  NEW.city := btrim(NEW.city);
  IF coalesce(length(NEW.customer_name), 0) NOT BETWEEN 2 AND 120
    OR coalesce(length(NEW.address), 0) NOT BETWEEN 5 AND 250
    OR coalesce(length(NEW.city), 0) NOT BETWEEN 2 AND 100
    OR coalesce(length(NEW.email), 0) NOT BETWEEN 5 AND 254
    OR NEW.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR coalesce(length(regexp_replace(NEW.phone, '[^0-9]', '', 'g')), 0) NOT BETWEEN 8 AND 15
    OR length(coalesce(NEW.zip, '')) > 20 OR length(coalesce(NEW.notes, '')) > 1000
    OR concat(NEW.customer_name, NEW.email, NEW.phone, NEW.address, NEW.city, NEW.zip) ~ '[<>]'
    OR coalesce(NEW.order_number, '') !~ '^LW-[A-Z0-9]{6,32}$' THEN
    RAISE EXCEPTION 'Kontrolloni të dhënat e kontaktit dhe adresën e porosisë.';
  END IF;
  IF jsonb_typeof(NEW.items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Shporta nuk është e vlefshme.';
  END IF;
  IF jsonb_array_length(NEW.items) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Shporta duhet të ketë nga 1 deri në 100 produkte.';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(NEW.items) LOOP
    BEGIN
      product_id := (item->>'id')::uuid;
      IF jsonb_typeof(item->'quantity') IS DISTINCT FROM 'number'
        OR (item->>'quantity') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'invalid quantity'; END IF;
      quantity := (item->>'quantity')::integer;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Produkti ose sasia në shportë nuk është e vlefshme.';
    END;
    IF quantity NOT BETWEEN 1 AND 99 OR product_id = ANY(seen_ids) THEN
      RAISE EXCEPTION 'Sasia e produktit nuk është e vlefshme.';
    END IF;
    seen_ids := array_append(seen_ids, product_id);
    SELECT * INTO product FROM public.products WHERE id = product_id FOR SHARE;
    IF NOT FOUND OR product.is_active IS FALSE OR product.in_stock IS FALSE
      OR product.price IS NULL OR product.price <= 0 THEN
      RAISE EXCEPTION 'Një produkt nuk është më i disponueshëm. Kontrolloni shportën.';
    END IF;
    expected_subtotal := expected_subtotal + round(product.price, 2) * quantity;
    canonical_items := canonical_items || jsonb_build_array(jsonb_build_object(
      'id', product.id, 'name', product.name, 'brand', product.brand,
      'image', product.image, 'price', round(product.price, 2), 'quantity', quantity
    ));
  END LOOP;
  expected_shipping := CASE WHEN expected_subtotal >= 50 THEN 0 ELSE 3 END;
  IF NEW.subtotal IS DISTINCT FROM expected_subtotal
    OR NEW.shipping IS DISTINCT FROM expected_shipping
    OR NEW.total IS DISTINCT FROM expected_subtotal + expected_shipping THEN
    RAISE EXCEPTION 'Çmimi i porosisë ndryshoi. Rifreskoni shportën dhe kontrolloni totalin.';
  END IF;
  NEW.items := canonical_items;
  NEW.status := 'pending_supplier_check';
  NEW.created_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_checkout_order() FROM PUBLIC;
DROP TRIGGER IF EXISTS validate_checkout_order_before_insert ON public.orders;
CREATE TRIGGER validate_checkout_order_before_insert
BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.validate_checkout_order();
COMMIT;
