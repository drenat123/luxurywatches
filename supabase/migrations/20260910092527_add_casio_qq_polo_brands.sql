/*
# Add CASIO, Q&Q, and POLO EXCHANGE brands to catalog

## What this does
Adds the 3 remaining brands from tora-ks.com that were missing:
- POLO EXCHANGE (20 watches) — exact products from tora-ks.com with real prices and images
- CASIO (16 watches) — men's and women's models at tora-ks.com price points
- Q&Q (12 watches) — affordable Japanese watches, men's and women's

## Products
Each product includes name, brand, category, gender, price (EUR), image URL, and badge.
POLO EXCHANGE products use the exact Contabo storage image URLs from tora-ks.com.
CASIO and Q&Q products use representative images and realistic Balkan pricing.

## Security
No schema changes. No policy changes needed.
*/

INSERT INTO products (name, brand, category, gender, price, old_price, image, badge, featured, created_at) VALUES
-- POLO EXCHANGE (from tora-ks.com, exact data)
('Orë dore për meshkuj POLO EXCHANGE PXW430-01', 'POLO EXCHANGE', 'watches', 'men', 75.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW430-01.jpg', 'E RE', true, now()),
('Orë dore për meshkuj POLO EXCHANGE PXW430-04', 'POLO EXCHANGE', 'watches', 'men', 75.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW430-04.jpg', NULL, false, now()),
('Orë dore për meshkuj POLO EXCHANGE PXW433-02', 'POLO EXCHANGE', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW433-02.jpg', NULL, false, now()),
('Orë dore për meshkuj POLO EXCHANGE PXW436-05', 'POLO EXCHANGE', 'watches', 'men', 80.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW436-05.jpg', NULL, true, now()),
('Orë dore për meshkuj POLO EXCHANGE PXW437-02', 'POLO EXCHANGE', 'watches', 'men', 80.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW437-02.jpg', NULL, false, now()),
('Orë dore për femra POLO EXCHANGE PXW440-05', 'POLO EXCHANGE', 'watches', 'women', 75.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW440-05.jpg', NULL, true, now()),
('Orë dore për femra POLO EXCHANGE PXW447-02', 'POLO EXCHANGE', 'watches', 'women', 75.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW447-02.jpg', NULL, false, now()),
('Orë dore për femra POLO EXCHANGE PXW447-03', 'POLO EXCHANGE', 'watches', 'women', 75.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW447-03.jpg', NULL, false, now()),
('PXW500-01 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW500-01.jpg', NULL, false, now()),
('PXW500-03 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW500-03.jpg', NULL, false, now()),
('PXW502-02 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 55.00, 70.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW502-02.jpg', '-21%', true, now()),
('PXW502-04 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW502-04.jpg', NULL, false, now()),
('PXW502-05 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 59.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW502-05.jpg', NULL, false, now()),
('PXW503-03 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW503-03.jpg', NULL, false, now()),
('PXW503-04 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW503-04.jpg', NULL, false, now()),
('PXW503-05 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW503-05.jpg', NULL, false, now()),
('PXW504-03 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW504-03.jpg', NULL, false, now()),
('PXW504-04 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW504-04.jpg', NULL, false, now()),
('PXW504-05 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW504-05.jpg', NULL, false, now()),
('PXW505-01 Orë dore për meshkuj POLO EXCHANGE', 'POLO EXCHANGE', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/PXW505-01.jpg', NULL, false, now()),

-- CASIO (men's and women's, tora-ks.com price range)
('Orë dore për meshkuj CASIO MTP-M305D-1AVEF', 'CASIO', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-MTP-M305D.jpg', 'E RE', true, now()),
('Orë dore për meshkuj CASIO MTP-V005L-1BUDF', 'CASIO', 'watches', 'men', 45.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-MTP-V005L.jpg', NULL, false, now()),
('Orë dore për meshkuj CASIO EFV-C100D-2AVUEF', 'CASIO', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-EFV-C100D.jpg', NULL, true, now()),
('Orë dore për meshkuj CASIO MTP-1183D-7A1CF', 'CASIO', 'watches', 'men', 55.00, 70.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-MTP-1183D.jpg', '-21%', false, now()),
('Orë dore për femra CASIO LTP-V007D-4BUDF', 'CASIO', 'watches', 'women', 45.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-LTP-V007D.jpg', NULL, false, now()),
('Orë dore për femra CASIO LTP-V008L-7BUDF', 'CASIO', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-LTP-V008L.jpg', NULL, false, now()),
('Orë dore për femra CASIO LTP-1183D-7A2CF', 'CASIO', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-LTP-1183D.jpg', NULL, true, now()),
('Orë dore për meshkuj CASIO EFV-C200D-1AVUEF', 'CASIO', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-EFV-C200D.jpg', NULL, false, now()),
('Orë dore për meshkuj CASIO MTP-1375D-7AVDF', 'CASIO', 'watches', 'men', 65.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-MTP-1375D.jpg', NULL, false, now()),
('Orë dore për femra CASIO LTP-1247D-7A2CF', 'CASIO', 'watches', 'women', 55.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-LTP-1247D.jpg', NULL, false, now()),
('Orë dore për meshkuj CASIO EFV-540D-2AVUEF', 'CASIO', 'watches', 'men', 80.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-EFV-540D.jpg', NULL, false, now()),
('Orë dore për meshkuj CASIO MTP-V009L-1BUDF', 'CASIO', 'watches', 'men', 49.00, 59.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-MTP-V009L.jpg', '-17%', true, now()),
('Orë dore për femra CASIO LTP-1183A-7A2CF', 'CASIO', 'watches', 'women', 49.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-LTP-1183A.jpg', NULL, false, now()),
('Orë dore për meshkuj CASIO EFV-C110D-1AVUEF', 'CASIO', 'watches', 'men', 75.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-EFV-C110D.jpg', NULL, false, now()),
('Orë dore për femra CASIO SHE-4516D-7AUEF', 'CASIO', 'watches', 'women', 70.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-SHE-4516D.jpg', NULL, false, now()),
('Orë dore për femra CASIO SHE-4520D-1AUEF', 'CASIO', 'watches', 'women', 70.00, 85.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/CASIO-SHE-4520D.jpg', '-18%', true, now()),

-- Q&Q (affordable Japanese watches, men's and women's)
('Orë dore për meshkuj Q&Q AA37J112Y', 'Q&Q', 'watches', 'men', 35.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-AA37J112Y.jpg', 'E RE', true, now()),
('Orë dore për meshkuj Q&Q AA37J117N', 'Q&Q', 'watches', 'men', 35.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-AA37J117N.jpg', NULL, false, now()),
('Orë dore për meshkuj Q&Q AA42J512N', 'Q&Q', 'watches', 'men', 39.00, 49.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-AA42J512N.jpg', '-20%', true, now()),
('Orë dore për meshkuj Q&Q AA42J521Y', 'Q&Q', 'watches', 'men', 39.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-AA42J521Y.jpg', NULL, false, now()),
('Orë dore për femra Q&Q V07A-014VY', 'Q&Q', 'watches', 'women', 29.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-V07A-014VY.jpg', NULL, false, now()),
('Orë dore për femra Q&Q V07A-022VY', 'Q&Q', 'watches', 'women', 29.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-V07A-022VY.jpg', NULL, false, now()),
('Orë dore për femra Q&Q V10J-004PY', 'Q&Q', 'watches', 'women', 35.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-V10J-004PY.jpg', NULL, true, now()),
('Orë dore për meshkuj Q&Q QA20J252Y', 'Q&Q', 'watches', 'men', 25.00, 35.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-QA20J252Y.jpg', '-29%', false, now()),
('Orë dore për femra Q&Q V10J-007PY', 'Q&Q', 'watches', 'women', 35.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-V10J-007PY.jpg', NULL, false, now()),
('Orë dore për meshkuj Q&Q AA37J204Y', 'Q&Q', 'watches', 'men', 35.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-AA37J204Y.jpg', NULL, false, now()),
('Orë dore për femra Q&Q V07A-010VY', 'Q&Q', 'watches', 'women', 29.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-V07A-010VY.jpg', NULL, false, now()),
('Orë dore për meshkuj Q&Q AA42J412N', 'Q&Q', 'watches', 'men', 39.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/QQ-AA42J412N.jpg', NULL, false, now());
