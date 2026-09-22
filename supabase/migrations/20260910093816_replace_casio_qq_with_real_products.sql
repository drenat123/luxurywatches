/*
# Replace CASIO and Q&Q with real tora-ks.com products

## What this does
Deletes the placeholder CASIO and Q&Q products (already done via execute_sql)
and inserts the exact real products from tora-ks.com with real Contabo storage
image URLs, real prices, and real old/sale prices.

## Sources
- CASIO: https://www.tora-ks.com/category/ORACASIO (20 products)
- Q&Q: https://www.tora-ks.com/category/Q&Q (20 products)

## Security
No schema changes. No policy changes needed.
*/

INSERT INTO products (name, brand, category, gender, price, old_price, image, badge, featured, created_at) VALUES
-- CASIO (real products from tora-ks.com/category/ORACASIO)
('Orë dore Casio për femra LTP-1314L-8AVDF', 'CASIO', 'watches', 'women', 46.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LTP-1314L-8AVDF.jpg', NULL, false, now()),
('Orë dore Casio për femra LTP-V005D-1B2UDF', 'CASIO', 'watches', 'women', 35.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LTP-V005D-1B2UDF.JPG', NULL, false, now()),
('Orë dore Casio për femra LTP-VT01GL-4BUDF', 'CASIO', 'watches', 'women', 34.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LTP-VT01GL-4BUDF.jpg', NULL, false, now()),
('Orë dore Casio për meshkuj LWA-300HRG-5EVDF', 'CASIO', 'watches', 'men', 58.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LWA-300HRG-5EVDF.jpg', NULL, false, now()),
('Orë dore Casio për meshkuj MCW-100H-9A2VDF', 'CASIO', 'watches', 'men', 90.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MCW-100H-9A2VDF.jpg', NULL, true, now()),
('Orë dore Casio për meshkuj MCW-200H-1AVDF', 'CASIO', 'watches', 'men', 90.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MCW-200H-1AVDF.jpg', NULL, true, now()),
('Orë dore Casio për meshkuj MWA-100H-1A2VDF', 'CASIO', 'watches', 'men', 65.00, 85.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/67e12915452cd.jpg', '-24%', true, now()),
('Orë dore Casio për meshkuj MWA-100HD-1AVDF', 'CASIO', 'watches', 'men', 89.00, 105.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MWA-100HD-1AVDF.jpg', '-15%', false, now()),
('Orë dore Casio për meshkuj MWA-100HD-7AVDF', 'CASIO', 'watches', 'men', 89.00, 105.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MWA-100HD-7AVDF.JPG', '-15%', false, now()),
('Orë dore Casio për meshkuj MWD-100H-2AVDF', 'CASIO', 'watches', 'men', 65.00, 79.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MWD-100H-2AVDF.jpg', '-18%', false, now()),
('Orë dore Casio për meshkuj MWD-100H-9AVDF', 'CASIO', 'watches', 'men', 65.00, 78.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MWD-100H-9AVDF.jpg', '-17%', false, now()),
('Orë dore Casio për meshkuj MWD-100HD-1BVDF', 'CASIO', 'watches', 'men', 84.00, 105.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MWD-100HD-1BVDF.jpg', '-20%', true, now()),
('AQ-S810W-1BVDF Orë dore Casio për meshkuj', 'CASIO', 'watches', 'men', 85.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/67e1206ab2bf8.jpg', NULL, false, now()),
('AE-1400WHD-1AVDF Orë dore Casio për meshkuj', 'CASIO', 'watches', 'men', 63.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/67e51df518754.jpg', NULL, false, now()),
('A171WEG-9ADF Orë dore për femra CASIO', 'CASIO', 'watches', 'women', 99.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A171WEG-9ADF.jpg', NULL, true, now()),
('AMW-880D-3AVDF Orë dore për meshkuj CASIO', 'CASIO', 'watches', 'men', 115.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/AMW-880D-3AVDF.jpg', NULL, true, now()),
('LA680WA-1 Orë dore për meshkuj CASIO', 'CASIO', 'watches', 'men', 47.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LA680WA-1.jpg', NULL, false, now()),
('LTP-1169D-7A Orë dore për femra CASIO', 'CASIO', 'watches', 'women', 44.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LTP-1169D-7A.jpg', NULL, false, now()),
('LTP-1169G-9A Orë dore për femra CASIO', 'CASIO', 'watches', 'women', 63.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LTP-1169G-9A.jpg', NULL, false, now()),
('LTP-1169N-7A Orë dore për femra CASIO', 'CASIO', 'watches', 'women', 62.00, NULL, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/LTP-1169N-7A.jpg', NULL, false, now()),

-- Q&Q (real products from tora-ks.com/category/Q&Q)
('A05A-004PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 33.00, 50.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A05A-004PY.jpg', '-34%', true, now()),
('A05A-005PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 33.00, 50.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A05A-005PY.jpg', '-34%', true, now()),
('A14A-001PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 35.00, 53.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A14A-001PY.jpg', '-34%', false, now()),
('A36A-001PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 34.00, 53.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A36A-001PY.jpg', '-36%', false, now()),
('A36A-004PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 34.00, 53.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A36A-004PY.jpg', '-36%', false, now()),
('A480J215Y Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 26.00, 39.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A480J215Y.jpg', '-33%', false, now()),
('A482J205Y Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 26.00, 39.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/A482J205Y.jpg', '-33%', false, now()),
('C04A-034PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C04A-034PY.jpg', '-38%', false, now()),
('C04A-037PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C04A-037PY.jpg', '-38%', false, now()),
('C08A-001PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C08A-001PY.jpg', '-38%', false, now()),
('C08A-002PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C08A-002PY.jpg', '-38%', false, now()),
('C08A-005PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 26.00, 39.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C08A-005PY.jpg', '-33%', false, now()),
('C08A-007PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C08A-007PY.jpg', '-38%', false, now()),
('C08A-029PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C08A-029PY.jpg', '-38%', false, now()),
('C09A-025PY Orë dore për femra Q&Q', 'Q&Q', 'watches', 'women', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C09A-025PY.jpg', '-38%', true, now()),
('C10A-052PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 26.00, 39.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C10A-052PY.jpg', '-33%', false, now()),
('C10A-055PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C10A-055PY.jpg', '-38%', false, now()),
('C10A-065PY Orë dore për meshkuj Q&Q', 'Q&Q', 'watches', 'men', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C10A-065PY.jpg', '-38%', false, now()),
('C11A-003PY Orë dore për femra Q&Q', 'Q&Q', 'watches', 'women', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C11A-003PY.jpg', '-38%', true, now()),
('C11A-004PY Orë dore për femra Q&Q', 'Q&Q', 'watches', 'women', 21.00, 34.00, 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/C11A-004PY.jpg', '-38%', false, now());
