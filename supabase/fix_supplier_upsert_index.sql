-- Run once in Supabase SQL Editor, then rerun the importer.
DROP INDEX IF EXISTS products_supplier_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS products_supplier_sku_key
  ON products (supplier, supplier_sku);