/*
|# Remove PIERRE RICAUD and ADRIATICA brands and fix broken image URLs

## What this does
1. Removes PIERRE RICAUD and ADRIATICA products (brands not sold by user)
2. Updates image URLs that may be broken or incorrectly formatted
3. Ensures consistent image URL format with Contabo storage

## Changes
- Deletes PIERRE RICAUD and ADRIATICA products
- Fixes image URLs with hash-like filenames to proper model-based filenames
- Fixes uppercase .JPG extensions to lowercase for consistency

## Security
No schema changes. No policy changes needed.
*/

-- Remove PIERRE RICAUD and ADRIATICA products
DELETE FROM products WHERE brand = 'PIERRE RICAUD';
DELETE FROM products WHERE brand = 'ADRIATICA';

-- Fix CASIO images with hash filenames
UPDATE products 
SET image = 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/MWA-100H-1A2VDF.jpg'
WHERE image = 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/67e12915452cd.jpg';

UPDATE products 
SET image = 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/AQ-S810W-1BVDF.jpg'
WHERE image = 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/67e1206ab2bf8.jpg';

UPDATE products 
SET image = 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/AE-1400WHD-1AVDF.jpg'
WHERE image = 'https://eu2.contabostorage.com/104e3b3e187d4696bb198cc9404a3b7b%3Atoragroup/images/67e51df518754.jpg';

-- Fix uppercase .JPG extensions to lowercase for consistency
UPDATE products 
SET image = REPLACE(image, '.JPG', '.jpg')
WHERE image LIKE '%.JPG';