/*
# Seed Product Catalog
Inserts the initial product catalog for Luxury Watches Kosovë.
All products use real Pexels image URLs. Categories: watches, jewelry, sunglasses.
This is idempotent — uses ON CONFLICT to avoid duplicates on re-run.
*/

INSERT INTO products (name, brand, category, gender, price, old_price, image, badge, featured) VALUES
-- FEATURED WATCHES (8 products shown on homepage)
('Ferrucci Gold FC8123', 'Ferrucci', 'watches', 'men', 99.00, NULL, 'https://images.pexels.com/photos/12835314/pexels-photo-12835314.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'E RE', true),
('Orient Classic Automatic', 'Orient', 'watches', 'men', 189.00, NULL, 'https://images.pexels.com/photos/12835313/pexels-photo-12835313.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),
('Lee Cooper LC083.390', 'Lee Cooper', 'watches', 'men', 89.00, NULL, 'https://images.pexels.com/photos/12883180/pexels-photo-12883180.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),
('Polo Sport Edition', 'Polo Club', 'watches', 'men', 75.00, 95.00, 'https://images.pexels.com/photos/28977357/pexels-photo-28977357.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-20%', true),
('Casio Retro Silver', 'Casio', 'watches', 'unisex', 49.00, 65.00, 'https://images.pexels.com/photos/11638635/pexels-photo-11638635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-15%', true),
('Casio Petite Gold', 'Casio', 'watches', 'women', 79.00, NULL, 'https://images.pexels.com/photos/1136589/pexels-photo-1136589.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),
('Frank Alex Chronograph', 'Frank Alex', 'watches', 'men', 119.00, 140.00, 'https://images.pexels.com/photos/13273980/pexels-photo-13273980.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-30%', true),
('Omega Roman Numerals', 'Omega', 'watches', 'unisex', 299.00, NULL, 'https://images.pexels.com/photos/14312717/pexels-photo-14312717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, true),

-- ADDITIONAL WATCHES (shop catalog)
('Black Luxury Display', 'VVS', 'watches', 'men', 159.00, NULL, 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Silver Premium Box', 'Maksim', 'watches', 'men', 129.00, NULL, 'https://images.pexels.com/photos/32815447/pexels-photo-32815447.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Hublot Rose Gold', 'Hublot', 'watches', 'men', 349.00, NULL, 'https://images.pexels.com/photos/9561299/pexels-photo-9561299.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'E RE', false),
('Leather Brown Strap', 'Glorious', 'watches', 'men', 109.00, NULL, 'https://images.pexels.com/photos/13273982/pexels-photo-13273982.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Luxury Gold Leather', 'Ferrucci', 'watches', 'women', 139.00, NULL, 'https://images.pexels.com/photos/1136590/pexels-photo-1136590.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Elegant Moon Phase', 'Orient', 'watches', 'men', 199.00, NULL, 'https://images.pexels.com/photos/12835312/pexels-photo-12835312.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Wooden Chronograph', 'GENTCREATE', 'watches', 'unisex', 69.00, 89.00, 'https://images.pexels.com/photos/9830093/pexels-photo-9830093.png?auto=compress&cs=tinysrgb&h=650&w=940', '-22%', false),
('Silver Diamond Markers', 'Roman Koval', 'watches', 'women', 179.00, NULL, 'https://images.pexels.com/photos/15210883/pexels-photo-15210883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Luxury Reflective Gold', 'Dream', 'watches', 'men', 259.00, NULL, 'https://images.pexels.com/photos/28135838/pexels-photo-28135838.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'HOT', false),
('Leather Strap Analog', 'Castorly', 'watches', 'men', 99.00, NULL, 'https://images.pexels.com/photos/3829441/pexels-photo-3829441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Burlap Black Edition', 'Khashfa', 'watches', 'men', 115.00, 145.00, 'https://images.pexels.com/photos/9453448/pexels-photo-9453448.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-20%', false),
('B&W Elegant Timepiece', 'Kibo', 'watches', 'unisex', 189.00, NULL, 'https://images.pexels.com/photos/12987488/pexels-photo-12987488.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),

-- JEWELRY / BRACELETS
('Rose Gold Bracelet', 'Glorious', 'jewelry', 'women', 45.00, NULL, 'https://images.pexels.com/photos/6716441/pexels-photo-6716441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'E RE', true),
('Gemstone Bracelet', 'Glorious', 'jewelry', 'women', 55.00, 70.00, 'https://images.pexels.com/photos/6716446/pexels-photo-6716446.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-21%', false),
('Diamond Bracelet Duo', 'Glorious', 'jewelry', 'women', 85.00, NULL, 'https://images.pexels.com/photos/6716442/pexels-photo-6716442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Luxury Diamond Bracelet', 'Glorious', 'jewelry', 'women', 95.00, NULL, 'https://images.pexels.com/photos/8891958/pexels-photo-8891958.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),

-- SUNGLASSES
('Aviator Blue Lens', 'Fashion', 'sunglasses', 'unisex', 39.00, NULL, 'https://images.pexels.com/photos/32677214/pexels-photo-32677214.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'E RE', true),
('Modern Blue Aviator', 'Fashion', 'sunglasses', 'men', 35.00, 45.00, 'https://images.pexels.com/photos/32677238/pexels-photo-32677238.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '-22%', false),
('Black Sunglasses + Case', 'Fashion', 'sunglasses', 'unisex', 42.00, NULL, 'https://images.pexels.com/photos/32677246/pexels-photo-32677246.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Brown Lens Metal Arm', 'Fashion', 'sunglasses', 'women', 38.00, NULL, 'https://images.pexels.com/photos/32677205/pexels-photo-32677205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false),
('Tortoiseshell Brown', 'Fashion', 'sunglasses', 'unisex', 41.00, NULL, 'https://images.pexels.com/photos/32677241/pexels-photo-32677241.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, false)
ON CONFLICT DO NOTHING;
