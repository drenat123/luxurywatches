import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');
const outputPath = path.resolve('supabase/restore-products.sql');

function productRows(fileName, startMarker, endMarker) {
  const source = fs.readFileSync(path.join(migrationsDir, fileName), 'utf8');
  const start = startMarker ? source.indexOf(startMarker) : 0;
  const end = endMarker ? source.indexOf(endMarker, start) : source.length;
  const section = source.slice(start, end === -1 ? source.length : end);
  return section
    .split(/\r?\n/)
    .filter((line) => line.startsWith("('") )
    .map((line) => line.replace(/[,;]+$/, ''))
    .map((line) => {
      const values = line.slice(1).split(/,\s*/);
      const createdAt = values[9].replace(/\)$/, '');
      return `(${values[0]}, ${values[0]}, ${values[1]}, ${values[2]}, ${values[4]}, ${values[5]}, ${values[5]}, ${values[6]}, ${values[6]}, ${values[3]}, ${values[7]}, ${values[8]}, ${createdAt})`;
    });
}

const rows = [
  ...productRows('20260909140354_replace_with_tora_ks_catalog.sql', 'INSERT INTO products', null),
  ...productRows('20260910092527_add_casio_qq_polo_brands.sql', '-- POLO EXCHANGE', '-- CASIO'),
  ...productRows('20260910093816_replace_casio_qq_with_real_products.sql', 'INSERT INTO products', null),
];

const imageFixes = fs.readFileSync(
  path.join(migrationsDir, '20260910104700_fix_broken_image_urls.sql'),
  'utf8',
).split(/\r?\n/)
  .filter((line) => line.startsWith('UPDATE ') || line.startsWith('SET ') || line.startsWith('WHERE '))
  .map((line) => line.replace(/\bimage\b/g, 'image_url'));

const sql = [
  '-- Generated from the checked-in product catalog migrations.',
  '-- Run this once in Supabase Dashboard > SQL Editor.',
  'ALTER TABLE products',
  '  ADD COLUMN IF NOT EXISTS name text,',
  '  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT \'watches\',',
  '  ADD COLUMN IF NOT EXISTS old_price numeric,',
  '  ADD COLUMN IF NOT EXISTS image text,',
  '  ADD COLUMN IF NOT EXISTS badge text,',
  '  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;',
  '',
  'DELETE FROM products;',
  '',
  'INSERT INTO products (title, name, brand, category, price, original_price, old_price, image_url, image, gender, badge, featured, created_at) VALUES',
  `${rows.join(',\n')};`,
  '',
  '-- Normalize the image URLs used by the catalog.',
  imageFixes.join('\n'),
  '',
].join('\n');

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Generated ${outputPath} with ${rows.length} products.`);