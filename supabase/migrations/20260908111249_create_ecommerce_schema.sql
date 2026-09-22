/*
# E-Commerce Schema: Products and Orders

## Overview
Creates the core tables for the Luxury Watches Kosovë e-commerce store.
This is a single-tenant app with no authentication — visitors browse products
and place orders anonymously.

## New Tables

### products
- `id` (uuid, PK) — unique product identifier
- `name` (text) — product name
- `brand` (text) — brand/manufacturer name
- `category` (text) — category: watches, jewelry, sunglasses
- `gender` (text) — target: men, women, unisex
- `price` (numeric) — current selling price in EUR
- `old_price` (numeric, nullable) — original price for discounted items
- `image` (text) — product image URL
- `badge` (text, nullable) — optional badge text (e.g. "E RE", "-20%")
- `featured` (boolean) — show on homepage
- `created_at` (timestamptz) — creation timestamp

### orders
- `id` (uuid, PK) — unique order identifier
- `order_number` (text) — human-readable order number (e.g. LW-XXXXX)
- `customer_name` (text) — full name
- `email` (text) — customer email
- `phone` (text) — phone number
- `address` (text) — shipping address
- `city` (text) — city
- `zip` (text, nullable) — postal code
- `notes` (text, nullable) — delivery instructions
- `payment_method` (text) — cod or bank
- `items` (jsonb) — array of cart items at time of order
- `subtotal` (numeric) — product subtotal
- `shipping` (numeric) — shipping cost
- `total` (numeric) — grand total
- `status` (text) — order status, defaults to 'pending'
- `created_at` (timestamptz) — order timestamp

## Security
- Products: public read (anon + authenticated), no writes from anon.
- Orders: anon can INSERT only (customers place orders). SELECT/UPDATE/DELETE
  are denied to anon to protect customer data. The store owner views orders
  through the Supabase dashboard with elevated privileges.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL DEFAULT 'watches',
  gender text NOT NULL DEFAULT 'unisex',
  price numeric(10,2) NOT NULL,
  old_price numeric(10,2),
  image text NOT NULL,
  badge text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  zip text,
  notes text,
  payment_method text NOT NULL DEFAULT 'cod',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
