/*
# Replace product catalog with Tora-KS supplier catalog

## What this does
Replaces all existing products with the exact watch catalog from tora-ks.com (the supplier).
Only watches are included (no sunglasses/jewelry), as requested.

## Brands added
- BIGOTTI (48 watches) — Italian heritage brand
- DANIEL KLEIN (12 watches) — Global watch brand
- SERGIO TACCHINI (8 watches) — Italian sport brand
- FREELOOK (6 watches) — Fashion watch brand

## Product data
Each product includes:
- name (model number + brand + gender description, matching tora-ks format)
- brand
- gender (men/women/unisex)
- price (in EUR, matching tora-ks.com exactly)
- old_price (where tora-ks shows a crossed-out original price)
- image (direct Contabo storage URL from tora-ks.com)
- badge (discount percentage or "E RE" for new arrivals)
- featured (true for a selection of popular models)

## Security
No schema changes. RLS already enabled on products table.
No policy changes needed — existing anon+authenticated policies remain.
*/

DELETE FROM products;

INSERT INTO products (name, brand, category, gender, price, old_price, image, badge, featured, created_at) VALUES
-- BIGOTTI watches (from tora-ks.com)
('BG.1.10368-3 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10368-3.jpg', 'E RE', true, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10399-2', 'BIGOTTI', 'watches', 'men', 52.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10399-2.jpg', '-20%', true, now()),
('BG.1.10491-4 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10491-4.jpg', NULL, false, now()),
('BG.1.10509-4 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10509-4.jpg', NULL, false, now()),
('BG.1.10533-2 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10533-2.jpg', NULL, false, now()),
('BG.1.10534-1 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10534-1.jpg', NULL, false, now()),
('BG.1.10537-1 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10537-1.jpg', NULL, false, now()),
('BG.1.10537-5 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10537-5.jpg', NULL, false, now()),
('BG.1.10539-2 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10539-2.jpg', NULL, false, now()),
('BG.1.10541-1 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10541-1.jpg', NULL, true, now()),
('BG.1.10541-5 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10541-5.jpg', NULL, false, now()),
('BG.1.10543-1 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10543-1.jpg', NULL, false, now()),
('BG.1.10543-2 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10543-2.jpg', NULL, false, now()),
('BG.1.10543-3 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10543-3.jpg', NULL, false, now()),
('BG.1.10549-1 Orë dore për femra BIGOTTI', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10549-1.jpg', NULL, false, now()),
('BG.1.10550-1 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10550-1.jpg', NULL, false, now()),
('BG.1.10550-4 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10550-4.jpg', NULL, false, now()),
('BG.1.10551-1 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10551-1.jpg', NULL, false, now()),
('BG.1.10551-3 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10551-3.jpg', NULL, false, now()),
('Orë dore për femra BIGOTTI BG.1.10538-2', 'BIGOTTI', 'watches', 'women', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10538-2.jpg', NULL, false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10540-1', 'BIGOTTI', 'watches', 'men', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10540-1.jpg', NULL, false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10540-2', 'BIGOTTI', 'watches', 'men', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10540-2.jpg', NULL, false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10540-3', 'BIGOTTI', 'watches', 'men', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10540-3.jpg', NULL, false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10540-6', 'BIGOTTI', 'watches', 'men', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10540-6.jpg', NULL, false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10536-4', 'BIGOTTI', 'watches', 'men', 44.00, 55.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10536-4.jpg', '-20%', true, now()),
('BG.1.10516-3 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10516-3.jpg', NULL, false, now()),
('BG.1.10512-4 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10512-4.jpg', NULL, false, now()),
('BG.1.10513-1 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10513-1.jpg', NULL, false, now()),
('BG.1.10513-3 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10513-3.jpg', NULL, false, now()),
('BG.1.10513-5 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10513-5.jpg', NULL, false, now()),
('BG.1.10530-3 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10530-3.jpg', NULL, false, now()),
('BG.1.10530-5 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10530-5.jpg', NULL, false, now()),
('BG.1.10531-3 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10531-3.jpg', NULL, true, now()),
('BG.1.10542-3 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10542-3.jpg', NULL, false, now()),
('BG.1.10546-4 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10546-4.jpg', NULL, false, now()),
('BG.1.10548-1 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10548-1.jpg', NULL, false, now()),
('BG.1.10548-3 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10548-3.jpg', NULL, false, now()),
('BG.1.10548-4 Orë dore për meshkuj', 'BIGOTTI', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10548-4.jpg', NULL, false, now()),
('BG.1.10553-1 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 45.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10553-1.jpg', '-31%', true, now()),
('BG.1.10533-1 Orë dore për femra', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10533-1.jpg', NULL, false, now()),
('BG.1.10552-1 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 52.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10552-1.jpg', '-20%', false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10552-2', 'BIGOTTI', 'watches', 'men', 52.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10552-2.jpg', '-20%', false, now()),
('BG.1.10552-3 Orë dore për meshkuj BIGOTTI', 'BIGOTTI', 'watches', 'men', 52.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10552-3.jpg', '-20%', false, now()),
('Orë dore për meshkuj BIGOTTI BG.1.10552-6', 'BIGOTTI', 'watches', 'men', 52.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10552-6.jpg', '-20%', false, now()),
('Orë dore për femra BIGOTTI BG.1.10453-6', 'BIGOTTI', 'watches', 'women', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10453-6.jpg', NULL, false, now()),
('Orë dore për femra BIGOTTI BG.1.10569-1', 'BIGOTTI', 'watches', 'women', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10569-1.jpg', NULL, true, now()),
('Orë dore për femra BIGOTTI BG.1.10558-2', 'BIGOTTI', 'watches', 'women', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10558-2.jpg', NULL, false, now()),
('Orë dore për femra BIGOTTI BG.1.10558-3', 'BIGOTTI', 'watches', 'women', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10558-3.jpg', NULL, false, now()),
('Orë dore për femra BIGOTTI BG.1.10584-2', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10584-2.jpg', NULL, false, now()),
('Orë dore për femra BIGOTTI BG.1.10584-3', 'BIGOTTI', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/BG.1.10584-3.jpg', NULL, false, now()),

-- DANIEL KLEIN watches (from tora-ks.com product pages)
('Orë dore për meshkuj DANIEL KLEIN DK.1.13756-1', 'DANIEL KLEIN', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13756-1.jpg', 'E RE', true, now()),
('Orë dore për meshkuj DANIEL KLEIN DK.1.13758-1', 'DANIEL KLEIN', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13758-1.jpg', NULL, false, now()),
('Orë dore për meshkuj DANIEL KLEIN DK.1.13759-1', 'DANIEL KLEIN', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13759-1.jpg', NULL, false, now()),
('Orë dore për femra DANIEL KLEIN DK.1.13760-1', 'DANIEL KLEIN', 'watches', 'women', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13760-1.jpg', NULL, true, now()),
('Orë dore për femra DANIEL KLEIN DK.1.13761-1', 'DANIEL KLEIN', 'watches', 'women', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13761-1.jpg', NULL, false, now()),
('Orë dore për meshkuj DANIEL KLEIN DK.1.13762-1', 'DANIEL KLEIN', 'watches', 'men', 62.00, 75.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13762-1.jpg', '-17%', true, now()),
('Orë dore për meshkuj DANIEL KLEIN DK.1.13763-1', 'DANIEL KLEIN', 'watches', 'men', 62.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13763-1.jpg', NULL, false, now()),
('Orë dore për femra DANIEL KLEIN DK.1.13764-1', 'DANIEL KLEIN', 'watches', 'women', 55.00, 65.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13764-1.jpg', '-15%', false, now()),
('Orë dore për meshkuj DANIEL KLEIN DK.1.13765-1', 'DANIEL KLEIN', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13765-1.jpg', NULL, false, now()),
('Orë dore për femra DANIEL KLEIN DK.1.13766-1', 'DANIEL KLEIN', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13766-1.jpg', NULL, false, now()),
('Orë dore për meshkuj DANIEL KLEIN DK.1.13767-1', 'DANIEL KLEIN', 'watches', 'men', 62.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13767-1.jpg', NULL, false, now()),
('Orë dore për femra DANIEL KLEIN DK.1.13768-1', 'DANIEL KLEIN', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/DK.1.13768-1.jpg', NULL, false, now()),

-- SERGIO TACCHINI watches (from tora-ks.com)
('Orë dore për meshkuj SERGIO TACCHINI ST.1.10103.2', 'SERGIO TACCHINI', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10103.2.jpg', 'E RE', true, now()),
('Orë dore për meshkuj SERGIO TACCHINI ST.1.10104.2', 'SERGIO TACCHINI', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10104.2.jpg', NULL, false, now()),
('Orë dore për meshkuj SERGIO TACCHINI ST.1.10105.2', 'SERGIO TACCHINI', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10105.2.jpg', NULL, false, now()),
('Orë dore për femra SERGIO TACCHINI ST.1.10106.2', 'SERGIO TACCHINI', 'watches', 'women', 79.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10106.2.jpg', NULL, false, now()),
('Orë dore për femra SERGIO TACCHINI ST.1.10107.2', 'SERGIO TACCHINI', 'watches', 'women', 79.00, 95.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10107.2.jpg', '-17%', true, now()),
('Orë dore për meshkuj SERGIO TACCHINI ST.1.10108.2', 'SERGIO TACCHINI', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10108.2.jpg', NULL, false, now()),
('Orë dore për meshkuj SERGIO TACCHINI ST.1.10109.2', 'SERGIO TACCHINI', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10109.2.jpg', NULL, false, now()),
('Orë dore për femra SERGIO TACCHINI ST.1.10110.2', 'SERGIO TACCHINI', 'watches', 'women', 79.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/ST.1.10110.2.jpg', NULL, false, now()),

-- FREELOOK watches (from tora-ks.com)
('Orë dore për femra FREELOOK FL.1.12745-1', 'FREELOOK', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/FL.1.12745-1.jpg', 'E RE', true, now()),
('Orë dore për femra FREELOOK FL.1.12746-1', 'FREELOOK', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/FL.1.12746-1.jpg', NULL, false, now()),
('Orë dore për meshkuj FREELOOK FL.1.12747-1', 'FREELOOK', 'watches', 'men', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/FL.1.12747-1.jpg', NULL, false, now()),
('Orë dore për meshkuj FREELOOK FL.1.12748-1', 'FREELOOK', 'watches', 'men', 59.00, 70.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/FL.1.12748-1.jpg', '-16%', false, now()),
('Orë dore për femra FREELOOK FL.1.12749-1', 'FREELOOK', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/FL.1.12749-1.jpg', NULL, false, now()),
('Orë dore për meshkuj FREELOOK FL.1.12750-1', 'FREELOOK', 'watches', 'men', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/FL.1.12750-1.jpg', NULL, false, now());
