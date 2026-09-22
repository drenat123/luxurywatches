-- Supplier-first order workflow. Orders are created before payment.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_status text NOT NULL DEFAULT 'pending_supplier_check';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_requested_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

UPDATE orders SET supplier_status = CASE
  WHEN status IN ('paid', 'processing', 'shipped', 'completed') THEN 'supplier_confirmed'
  ELSE 'pending_supplier_check'
END WHERE supplier_status IS NULL OR supplier_status = '';

COMMENT ON COLUMN orders.supplier_status IS 'pending_supplier_check, confirmed, unavailable, awaiting_payment, paid_awaiting_arrival, ready_to_ship, shipped, cancelled';
