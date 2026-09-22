/*
# Re-seed Products: Watches Only

## Overview
Removes all jewelry and sunglasses products and replaces the catalog
with a watches-only collection. Products include a richer mix of brands
and gender tags (men, women, unisex) for better filtering.

## Changes
1. DELETE all existing products
2. INSERT new watches-only catalog (24 products)
3. No schema changes — same table structure

## Security
No security changes. Existing RLS policies remain in place.
*/

DELETE FROM products;

INSERT INTO products (name, brand, category, gender, price, old_price, image, badge, featured) VALUES
-- FEATURED WATCHES (8 shown on homepage)
('Ferrucci Gold FC8123', 'Ferrucci', 'watches', 'men', 99.00, NULL, 'https://images.pexels.com/photos/12835314/pexels-photo-12835314.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'E RE', true),
('Orient Classic Automatic', 'Orient', 'watches', 'men', 189.00, NULL, 'https://images.pexels.com/photos/12835313/pexels-photo-12835313.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),
('Lee Cooper LC083.390', 'Lee Cooper', 'watches', 'men', 89.00, NULL, 'https://images.pexels.com/photos/12883180/pexels-photo-12883180.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),
('Polo Sport Edition', 'Polo Club', 'watches', 'men', 75.00, 95.00, 'https://images.pexels.com/photos/28977357/pexels-photo-28977357.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-20%', true),
('Casio Retro Silver', 'Casio', 'watches', 'unisex', 49.00, 65.00, 'https://images.pexels.com/photos/11638635/pexels-photo-11638635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-15%', true),
('Casio Petite Gold', 'Casio', 'watches', 'women', 79.00, NULL, 'https://images.pexels.com/photos/1136589/pexels-photo-1136589.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),
('Frank Alex Chronograph', 'Frank Alex', 'watches', 'men', 119.00, 140.00, 'https://images.pexels.com/photos/13273980/pexels-photo-13273980.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-30%', true),
('Silver Diamond Markers', 'Roman Koval', 'watches', 'women', 179.00, NULL, 'https://images.pexels.com/photos/15210883/pexels-photo-15210883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),

-- MEN'S WATCHES (additional)
('Black Luxury Display', 'VVS', 'watches', 'men', 159.00, NULL, 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Silver Premium Box', 'Maksim', 'watches', 'men', 129.00, NULL, 'https://images.pexels.com/photos/32815447/pexels-photo-32815447.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Hublot Rose Gold', 'Hublot', 'watches', 'men', 349.00, NULL, 'https://images.pexels.com/photos/9561299/pexels-photo-9561299.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'E RE', false),
('Leather Brown Strap', 'Glorious', 'watches', 'men', 109.00, NULL, 'https://images.pexels.com/photos/13273982/pexels-photo-13273982.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Luxury Gold Leather', 'Ferrucci', 'watches', 'men', 139.00, NULL, 'https://images.pexels.com/photos/1136590/pexels-photo-1136590.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Elegant Moon Phase', 'Orient', 'watches', 'men', 199.00, NULL, 'https://images.pexels.com/photos/12835312/pexels-photo-12835312.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Wooden Chronograph', 'GENTCREATE', 'watches', 'unisex', 69.00, 89.00, 'https://images.pexels.com/photos/9830093/pexels-photo-9830093.png?auto=compress&cs=tinysrgb&h=650&w=940', '-22%', false),
('Luxury Reflective Gold', 'Dream', 'watches', 'men', 259.00, NULL, 'https://images.pexels.com/photos/28135838/pexels-photo-28135838.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'HOT', false),
('Leather Strap Analog', 'Castorly', 'watches', 'men', 99.00, NULL, 'https://images.pexels.com/photos/3829441/pexels-photo-3829441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Burlap Black Edition', 'Khashfa', 'watches', 'men', 115.00, 145.00, 'https://images.pexels.com/photos/9453448/pexels-photo-9453448.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-20%', false),
('B&W Elegant Timepiece', 'Kibo', 'watches', 'unisex', 189.00, NULL, 'https://images.pexels.com/photos/12987488/pexels-photo-12987488.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Blue Dial Reflective', 'Mungai', 'watches', 'men', 149.00, NULL, 'https://images.pexels.com/photos/6157411/pexels-photo-6157411.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Timex Chronograph Fabric', 'Timex', 'watches', 'unisex', 59.00, 75.00, 'https://images.pexels.com/photos/11638635/pexels-photo-11638635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-21%', false),
('Breitling Leather Case', 'Breitling', 'watches', 'men', 399.00, NULL, 'https://images.pexels.com/photos/30077330/pexels-photo-30077330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'HOT', false),

-- WOMEN'S WATCHES (additional)
('Elegant Stand Display', 'VVS', 'watches', 'women', 169.00, NULL, 'https://images.pexels.com/photos/9261531/pexels-photo-9261531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Silver Reflective Black', 'Sperindeo', 'watches', 'women', 145.00, 175.00, 'https://images.pexels.com/photos/16958879/pexels-photo-16958879.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-17%', false),
('Omega Roman Numerals', 'Omega', 'watches', 'unisex', 299.00, NULL, 'https://images.pexels.com/photos/14312717/pexels-photo-14312717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Leather Strap Luxury', 'Mungai', 'watches', 'women', 129.00, NULL, 'https://images.pexels.com/photos/6157408/pexels-photo-6157408.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false);
