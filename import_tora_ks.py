#!/usr/bin/env python3
"""Upsert a reviewed tora-ks JSON snapshot into Supabase in batches."""

from __future__ import annotations

import argparse
import getpass
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests

VALID_GENDERS = {'men', 'women', 'unisex'}


def is_valid_product(product: dict) -> bool:
    supplier_sku = str(product.get('supplier_sku') or '').strip()
    source_url = str(product.get('source_url') or '')
    image_url = str(product.get('image_url') or '')
    gallery = product.get('gallery') or []
    price = product.get('price')
    parsed_url = urlparse(source_url)
    return bool(
        product.get('title')
        and product.get('brand')
        and supplier_sku
        and parsed_url.scheme in {'http', 'https'}
        and parsed_url.netloc == 'www.tora-ks.com'
        and isinstance(price, (int, float))
        and price > 0
        and product.get('gender') in VALID_GENDERS
        and image_url.startswith(('http://', 'https://'))
        and isinstance(gallery, list)
        and all(isinstance(image, str) and image.startswith(('http://', 'https://')) for image in gallery)
        and isinstance(product.get('in_stock'), bool)
    )


def unique_valid_products(products: list[dict]) -> list[dict]:
    valid = []
    seen_skus = set()
    seen_urls = set()
    skipped = 0
    for product in products:
        sku = str(product.get('supplier_sku') or '').strip().casefold()
        url = str(product.get('source_url') or '').rstrip('/').casefold()
        if not is_valid_product(product) or sku in seen_skus or url in seen_urls:
            skipped += 1
            continue
        valid.append(product)
        seen_skus.add(sku)
        seen_urls.add(url)
    print(f'Validated {len(valid)} products; skipped {skipped} invalid or duplicate records.')
    return valid


def read_env(name: str) -> str | None:
    value = os.getenv(name)
    if value:
        return value
    env_path = Path('.env')
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding='utf-8').splitlines():
        key, separator, raw_value = line.partition('=')
        if separator and key.strip() == name:
            return raw_value.strip().strip('"').strip("'") or None
    return None


def to_row(product: dict) -> dict:
    old_price = product.get('original_price')
    price = product.get('price')
    badge = None
    if old_price and price and old_price > price:
        badge = f"-{round((old_price - price) / old_price * 100)}%"
    title = product['title']
    image_url = product['image_url']
    return {
        'title': title,
        'name': title,
        'brand': product['brand'],
        'category': product.get('category') or 'watches',
        'price': price,
        'original_price': old_price,
        'old_price': old_price,
        'image_url': image_url,
        'image': image_url,
        'gender': product.get('gender') or 'unisex',
        'badge': badge,
        'featured': False,
        'supplier': product.get('supplier') or 'tora-ks',
        'supplier_sku': product['supplier_sku'],
        'source_url': product.get('source_url'),
        'description': product.get('description'),
        'gallery': product.get('gallery') or [image_url],
        'in_stock': bool(product.get('in_stock', True)),
        'is_active': True,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path)
    parser.add_argument('--batch-size', type=int, default=50)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    products = unique_valid_products(json.loads(args.snapshot.read_text(encoding='utf-8')))
    rows = [to_row(product) for product in products]
    print(f'Prepared {len(rows)} supplier products.')
    if args.dry_run:
        print('Dry run: no Supabase writes performed.')
        return

    supabase_url = read_env('VITE_SUPABASE_URL')
    service_key = read_env('SUPABASE_SERVICE_ROLE_KEY') or getpass.getpass(
        'Enter Supabase service_role key (input hidden): '
    )
    if not supabase_url or not service_key:
        raise SystemExit('Set SUPABASE_SERVICE_ROLE_KEY in the environment before importing.')

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/products?on_conflict=supplier,supplier_sku"
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
    }
    for offset in range(0, len(rows), args.batch_size):
        batch = rows[offset:offset + args.batch_size]
        response = requests.post(endpoint, headers=headers, json=batch, timeout=60)
        if not response.ok:
            raise SystemExit(f'Batch {offset}:{offset + len(batch)} failed: {response.status_code} {response.text}')
        print(f'Imported {min(offset + len(batch), len(rows))}/{len(rows)}')


if __name__ == '__main__':
    main()
