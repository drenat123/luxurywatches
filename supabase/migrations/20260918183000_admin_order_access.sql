-- Restrict order management to the configured administrator.
DROP POLICY IF EXISTS "admin_read_orders" ON orders;
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'dreninallbani@gmail.com');
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'dreninallbani@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'dreninallbani@gmail.com');
